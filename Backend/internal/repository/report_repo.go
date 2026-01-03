package repository

import (
	"gorm.io/gorm"
)

// ReportQueryParams represents the query parameters for reports
type ReportQueryParams struct {
	CourseNo    string
	CourseName  string
	TeacherName string
	DeptNo      string
}

// RosterRow represents a row in the roster report
type RosterRow struct {
	CourseNo    string   `json:"course_no"`
	CourseName  string   `json:"course_name"`
	TeacherNo   string   `json:"teacher_no"`
	TeacherName string   `json:"teacher_name"`
	Hours       int      `json:"hours"`
	Credits     int      `json:"credits"`
	ClassTime   string   `json:"class_time"`
	ClassLoc    string   `json:"class_location"`
	ExamTime    string   `json:"exam_time"`
	DeptNo      string   `json:"dept_no"`
	StudentNo   string   `json:"student_no"`
	StudentName string   `json:"student_name"`
	Gender      string   `json:"gender"`
	UsualScore  *float64 `json:"usual_score"`
	ExamScore   *float64 `json:"exam_score"`
	FinalScore  *float64 `json:"final_score"`
}

// ReportRepository defines the interface for report data access
type ReportRepository interface {
	GetRosterData(params ReportQueryParams, withGrades bool) ([]RosterRow, error)
}

type reportRepo struct {
	db *gorm.DB
}

// NewReportRepository creates a new ReportRepository
func NewReportRepository(db *gorm.DB) ReportRepository {
	return &reportRepo{db: db}
}

func (r *reportRepo) GetRosterData(params ReportQueryParams, withGrades bool) ([]RosterRow, error) {
	selectCols := `
		courses.course_no, courses.name AS course_name,
		staff.staff_no AS teacher_no, staff.name AS teacher_name,
		courses.hours, courses.credits, courses.class_time, courses.class_location, courses.exam_time,
		departments.dept_no,
		students.student_no, students.name AS student_name, students.gender
	`
	if withGrades {
		selectCols += `, grades.usual_score, grades.exam_score, grades.final_score`
	} else {
		selectCols += `, NULL::numeric AS usual_score, NULL::numeric AS exam_score, NULL::numeric AS final_score`
	}

	q := r.db.Table("enrollments").
		Select(selectCols).
		Joins("JOIN students ON students.id = enrollments.student_id").
		Joins("JOIN courses ON courses.id = enrollments.course_id").
		Joins("JOIN staff ON staff.id = courses.teacher_id").
		Joins("JOIN departments ON departments.id = students.dept_id")

	if withGrades {
		q = q.Joins("LEFT JOIN grades ON grades.student_id = students.id AND grades.course_id = courses.id")
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
		// PRD: 按系号输出"本系所有教师担任的课程"
		q = q.Joins("JOIN departments AS teacher_dept ON teacher_dept.id = staff.dept_id").
			Where("teacher_dept.dept_no = ?", params.DeptNo)
	}

	var rows []RosterRow
	if err := q.Order("courses.course_no asc, students.student_no asc").Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
