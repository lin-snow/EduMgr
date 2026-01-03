package repository

import (
	"github.com/lin-snow/edumgr/internal/model"
	"gorm.io/gorm"
)

// GradeQueryRow represents a grade query result row
type GradeQueryRow struct {
	StudentID   uint     `json:"student_id"`
	StudentNo   string   `json:"student_no"`
	StudentName string   `json:"student_name"`
	Gender      string   `json:"gender"`
	CourseID    uint     `json:"course_id"`
	CourseNo    string   `json:"course_no"`
	CourseName  string   `json:"course_name"`
	TeacherID   uint     `json:"teacher_id"`
	TeacherNo   string   `json:"teacher_no"`
	TeacherName string   `json:"teacher_name"`
	DeptNo      string   `json:"dept_no"`
	Hours       int      `json:"hours"`
	Credits     int      `json:"credits"`
	ClassTime   string   `json:"class_time"`
	ClassLoc    string   `json:"class_location"`
	ExamTime    string   `json:"exam_time"`
	UsualScore  *float64 `json:"usual_score"`
	ExamScore   *float64 `json:"exam_score"`
	FinalScore  *float64 `json:"final_score"`
}

// GradeQueryParams represents the query parameters for grades
type GradeQueryParams struct {
	StudentNo   string
	StudentName string
	CourseNo    string
	CourseName  string
	TeacherName string
	DeptNo      string
}

// GradeRepository defines the interface for grade data access
type GradeRepository interface {
	FindByFilters(params GradeQueryParams) ([]GradeQueryRow, error)
	FindByStudentAndCourse(studentID, courseID uint) (*model.Grade, error)
	Create(grade *model.Grade) error
	Update(grade *model.Grade) error
	Upsert(grade *model.Grade) error
	WithTx(tx *gorm.DB) GradeRepository
	GetDB() *gorm.DB
}

type gradeRepo struct {
	db *gorm.DB
}

// NewGradeRepository creates a new GradeRepository
func NewGradeRepository(db *gorm.DB) GradeRepository {
	return &gradeRepo{db: db}
}

func (r *gradeRepo) WithTx(tx *gorm.DB) GradeRepository {
	return &gradeRepo{db: tx}
}

func (r *gradeRepo) GetDB() *gorm.DB {
	return r.db
}

func (r *gradeRepo) FindByFilters(params GradeQueryParams) ([]GradeQueryRow, error) {
	q := r.db.Table("grades").
		Select(`
			students.id AS student_id, students.student_no, students.name AS student_name, students.gender,
			courses.id AS course_id, courses.course_no, courses.name AS course_name,
			staff.id AS teacher_id, staff.staff_no AS teacher_no, staff.name AS teacher_name,
			departments.dept_no,
			courses.hours, courses.credits, courses.class_time, courses.class_location, courses.exam_time,
			grades.usual_score, grades.exam_score, grades.final_score
		`).
		Joins("JOIN students ON students.id = grades.student_id").
		Joins("JOIN courses ON courses.id = grades.course_id").
		Joins("JOIN staff ON staff.id = courses.teacher_id").
		Joins("JOIN departments ON departments.id = students.dept_id")

	if params.StudentNo != "" {
		q = q.Where("students.student_no = ?", params.StudentNo)
	}
	if params.StudentName != "" {
		q = q.Where("students.name ILIKE ?", "%"+params.StudentName+"%")
	}
	if params.CourseNo != "" {
		q = q.Where("courses.course_no = ?", params.CourseNo)
	}
	if params.CourseName != "" {
		q = q.Where("courses.name ILIKE ?", "%"+params.CourseName+"%")
	}
	if params.TeacherName != "" {
		q = q.Where("staff.name ILIKE ?", "%"+params.TeacherName+"%")
	}
	if params.DeptNo != "" {
		q = q.Where("departments.dept_no = ?", params.DeptNo)
	}

	var rows []GradeQueryRow
	if err := q.Order("courses.course_no asc, grades.final_score desc NULLS LAST, students.student_no asc").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *gradeRepo) FindByStudentAndCourse(studentID, courseID uint) (*model.Grade, error) {
	var grade model.Grade
	if err := r.db.Where("student_id = ? AND course_id = ?", studentID, courseID).First(&grade).Error; err != nil {
		return nil, err
	}
	return &grade, nil
}

func (r *gradeRepo) Create(grade *model.Grade) error {
	return r.db.Create(grade).Error
}

func (r *gradeRepo) Update(grade *model.Grade) error {
	return r.db.Save(grade).Error
}

func (r *gradeRepo) Upsert(grade *model.Grade) error {
	existing, err := r.FindByStudentAndCourse(grade.StudentID, grade.CourseID)
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}
	
	if existing != nil {
		grade.ID = existing.ID
		return r.Update(grade)
	}
	return r.Create(grade)
}
