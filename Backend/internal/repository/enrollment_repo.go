package repository

import (
	"time"

	"github.com/lin-snow/edumgr/internal/model"
	"gorm.io/gorm"
)

// EnrollmentQueryParams represents query parameters for enrollments
type EnrollmentQueryParams struct {
	StudentNo string
	CourseNo  string
	TermCode  string
	Page      int
	PageSize  int
}

// EnrollmentRow represents an enrollment with related info
type EnrollmentRow struct {
	ID          uint      `json:"id"`
	StudentID   uint      `json:"student_id"`
	StudentNo   string    `json:"student_no"`
	StudentName string    `json:"student_name"`
	CourseID    uint      `json:"course_id"`
	CourseNo    string    `json:"course_no"`
	CourseName  string    `json:"course_name"`
	Credits     int       `json:"credits"`
	TermID      uint      `json:"term_id"`
	TermCode    string    `json:"term_code"`
	TermName    string    `json:"term_name"`
	CreatedAt   time.Time `json:"created_at"`
}

// EnrollmentRepository defines the interface for enrollment data access
type EnrollmentRepository interface {
	FindByID(id uint) (*model.Enrollment, error)
	FindByStudentAndCourse(studentID, courseID uint) (*model.Enrollment, error)
	FindByFilters(params EnrollmentQueryParams) ([]EnrollmentRow, int64, error)
	FindByStudentID(studentID uint) ([]EnrollmentRow, error)
	GetCurrentCredits(studentID, termID uint) (int, error)
	CountDuplicates(studentID uint, courseIDs []uint) (int64, error)
	CreateBatch(enrollments []model.Enrollment) error
	Delete(id uint) error
	DeleteGradesByStudentAndCourse(studentID, courseID uint) error
	WithTx(tx *gorm.DB) EnrollmentRepository
	GetDB() *gorm.DB
}

type enrollmentRepo struct {
	db *gorm.DB
}

// NewEnrollmentRepository creates a new EnrollmentRepository
func NewEnrollmentRepository(db *gorm.DB) EnrollmentRepository {
	return &enrollmentRepo{db: db}
}

func (r *enrollmentRepo) WithTx(tx *gorm.DB) EnrollmentRepository {
	return &enrollmentRepo{db: tx}
}

func (r *enrollmentRepo) GetDB() *gorm.DB {
	return r.db
}

func (r *enrollmentRepo) FindByID(id uint) (*model.Enrollment, error) {
	var enrollment model.Enrollment
	if err := r.db.First(&enrollment, id).Error; err != nil {
		return nil, err
	}
	return &enrollment, nil
}

func (r *enrollmentRepo) FindByStudentAndCourse(studentID, courseID uint) (*model.Enrollment, error) {
	var enrollment model.Enrollment
	if err := r.db.Where("student_id = ? AND course_id = ?", studentID, courseID).First(&enrollment).Error; err != nil {
		return nil, err
	}
	return &enrollment, nil
}

func (r *enrollmentRepo) GetCurrentCredits(studentID, termID uint) (int, error) {
	var total int
	row := r.db.Table("enrollments").
		Select("COALESCE(SUM(courses.credits), 0) AS total").
		Joins("JOIN courses ON courses.id = enrollments.course_id").
		Where("enrollments.student_id = ? AND enrollments.term_id = ?", studentID, termID).
		Row()
	if err := row.Scan(&total); err != nil {
		return 0, err
	}
	return total, nil
}

func (r *enrollmentRepo) CountDuplicates(studentID uint, courseIDs []uint) (int64, error) {
	var count int64
	if err := r.db.Table("enrollments").
		Where("student_id = ? AND course_id IN ?", studentID, courseIDs).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *enrollmentRepo) CreateBatch(enrollments []model.Enrollment) error {
	return r.db.Create(&enrollments).Error
}

func (r *enrollmentRepo) Delete(id uint) error {
	return r.db.Delete(&model.Enrollment{}, id).Error
}

func (r *enrollmentRepo) DeleteGradesByStudentAndCourse(studentID, courseID uint) error {
	return r.db.Table("grades").Where("student_id = ? AND course_id = ?", studentID, courseID).Delete(nil).Error
}

func (r *enrollmentRepo) FindByFilters(params EnrollmentQueryParams) ([]EnrollmentRow, int64, error) {
	q := r.db.Table("enrollments").
		Select(`
			enrollments.id, enrollments.student_id, enrollments.course_id, enrollments.term_id, enrollments.created_at,
			students.student_no, students.name AS student_name,
			courses.course_no, courses.name AS course_name, courses.credits,
			terms.term_code, terms.name AS term_name
		`).
		Joins("JOIN students ON students.id = enrollments.student_id").
		Joins("JOIN courses ON courses.id = enrollments.course_id").
		Joins("JOIN terms ON terms.id = enrollments.term_id")

	if params.StudentNo != "" {
		q = q.Where("students.student_no = ?", params.StudentNo)
	}
	if params.CourseNo != "" {
		q = q.Where("courses.course_no = ?", params.CourseNo)
	}
	if params.TermCode != "" {
		q = q.Where("terms.term_code = ?", params.TermCode)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		q = q.Offset(offset).Limit(params.PageSize)
	}

	var rows []EnrollmentRow
	if err := q.Order("enrollments.created_at desc").Scan(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *enrollmentRepo) FindByStudentID(studentID uint) ([]EnrollmentRow, error) {
	var rows []EnrollmentRow
	if err := r.db.Table("enrollments").
		Select(`
			enrollments.id, enrollments.student_id, enrollments.course_id, enrollments.term_id, enrollments.created_at,
			students.student_no, students.name AS student_name,
			courses.course_no, courses.name AS course_name, courses.credits,
			terms.term_code, terms.name AS term_name
		`).
		Joins("JOIN students ON students.id = enrollments.student_id").
		Joins("JOIN courses ON courses.id = enrollments.course_id").
		Joins("JOIN terms ON terms.id = enrollments.term_id").
		Where("enrollments.student_id = ?", studentID).
		Order("terms.term_code desc, courses.course_no asc").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
