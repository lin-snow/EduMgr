package service

import (
	"sort"

	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

// GradeItem represents a single grade item for input
type GradeItem struct {
	StudentNo  string   `json:"student_no"`
	CourseNo   string   `json:"course_no"`
	UsualScore *float64 `json:"usual_score"`
	ExamScore  *float64 `json:"exam_score"`
	FinalScore *float64 `json:"final_score"`
}

// GradeRow represents a grade row in the response
type GradeRow struct {
	StudentNo   string   `json:"student_no"`
	StudentName string   `json:"student_name"`
	Gender      string   `json:"gender"`
	UsualScore  *float64 `json:"usual_score"`
	ExamScore   *float64 `json:"exam_score"`
	FinalScore  *float64 `json:"final_score"`
}

// CourseGradeGroup represents a course with its grades
type CourseGradeGroup struct {
	CourseNo    string     `json:"course_no"`
	CourseName  string     `json:"course_name"`
	TeacherNo   string     `json:"teacher_no"`
	TeacherName string     `json:"teacher_name"`
	Hours       int        `json:"hours"`
	Credits     int        `json:"credits"`
	ClassTime   string     `json:"class_time"`
	ClassLoc    string     `json:"class_location"`
	ExamTime    string     `json:"exam_time"`
	DeptNo      string     `json:"dept_no"`
	Rows        []GradeRow `json:"rows"`
}

// GradeQueryParams represents grade query parameters
type GradeQueryParams struct {
	StudentNo   string
	StudentName string
	CourseNo    string
	CourseName  string
	TeacherName string
	DeptNo      string
}

// MyGradeItem represents a student's own grade (flat structure for frontend)
type MyGradeItem struct {
	CourseNo   string   `json:"course_no"`
	CourseName string   `json:"course_name"`
	Credits    int      `json:"credits"`
	TermCode   string   `json:"term_code"`
	UsualScore *float64 `json:"usual_score"`
	ExamScore  *float64 `json:"exam_score"`
	FinalScore *float64 `json:"final_score"`
}

// GradeService defines the interface for grade business logic
type GradeService interface {
	Query(params GradeQueryParams) ([]CourseGradeGroup, error)
	QueryMyGrades(userID uint) ([]MyGradeItem, error)
	UpsertByCourse(courseNo string, items []GradeItem, role string, userID uint) error
	UpsertByStudent(studentNo string, items []GradeItem, role string, userID uint) error
}

type gradeService struct {
	gradeRepo   repository.GradeRepository
	courseRepo  repository.CourseRepository
	studentRepo repository.StudentRepository
	userRepo    repository.UserRepository
	staffRepo   repository.StaffRepository
	db          *gorm.DB
}

// NewGradeService creates a new GradeService
func NewGradeService(
	gradeRepo repository.GradeRepository,
	courseRepo repository.CourseRepository,
	studentRepo repository.StudentRepository,
	userRepo repository.UserRepository,
	staffRepo repository.StaffRepository,
	db *gorm.DB,
) GradeService {
	return &gradeService{
		gradeRepo:   gradeRepo,
		courseRepo:  courseRepo,
		studentRepo: studentRepo,
		userRepo:    userRepo,
		staffRepo:   staffRepo,
		db:          db,
	}
}

func (s *gradeService) Query(params GradeQueryParams) ([]CourseGradeGroup, error) {
	repoParams := repository.GradeQueryParams{
		StudentNo:   params.StudentNo,
		StudentName: params.StudentName,
		CourseNo:    params.CourseNo,
		CourseName:  params.CourseName,
		TeacherName: params.TeacherName,
		DeptNo:      params.DeptNo,
	}

	rows, err := s.gradeRepo.FindByFilters(repoParams)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}

	// Group by course
	m := make(map[string]*CourseGradeGroup)
	order := make([]string, 0)
	for _, r := range rows {
		key := r.CourseNo
		gp, ok := m[key]
		if !ok {
			gp = &CourseGradeGroup{
				CourseNo:    r.CourseNo,
				CourseName:  r.CourseName,
				TeacherNo:   r.TeacherNo,
				TeacherName: r.TeacherName,
				Hours:       r.Hours,
				Credits:     r.Credits,
				ClassTime:   r.ClassTime,
				ClassLoc:    r.ClassLoc,
				ExamTime:    r.ExamTime,
				DeptNo:      r.DeptNo,
			}
			m[key] = gp
			order = append(order, key)
		}
		gp.Rows = append(gp.Rows, GradeRow{
			StudentNo:   r.StudentNo,
			StudentName: r.StudentName,
			Gender:      r.Gender,
			UsualScore:  r.UsualScore,
			ExamScore:   r.ExamScore,
			FinalScore:  r.FinalScore,
		})
	}

	sort.Strings(order)
	result := make([]CourseGradeGroup, 0, len(order))
	for _, k := range order {
		result = append(result, *m[k])
	}
	return result, nil
}

// QueryMyGrades returns grades for the current student user (flat structure)
func (s *gradeService) QueryMyGrades(userID uint) ([]MyGradeItem, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil || user.StudentID == nil {
		return nil, pkg.NewAppError(pkg.ErrCodeStudentNotBound, "student not bound")
	}

	rows, err := s.gradeRepo.FindByStudentID(*user.StudentID)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}

	result := make([]MyGradeItem, len(rows))
	for i, r := range rows {
		result[i] = MyGradeItem{
			CourseNo:   r.CourseNo,
			CourseName: r.CourseName,
			Credits:    r.Credits,
			TermCode:   r.TermCode,
			UsualScore: r.UsualScore,
			ExamScore:  r.ExamScore,
			FinalScore: r.FinalScore,
		}
	}
	return result, nil
}

// checkTeacherCoursePermission checks if teacher can modify grades for the course
func (s *gradeService) checkTeacherCoursePermission(userID uint, courseID uint) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil || user.StaffID == nil {
		return pkg.NewAppError(pkg.ErrCodeForbidden, "teacher not bound")
	}

	course, err := s.courseRepo.FindByID(courseID)
	if err != nil {
		return pkg.NewAppError(pkg.ErrCodeGradeCourseNF, "course not found")
	}

	if course.TeacherID != *user.StaffID {
		return pkg.NewAppError(pkg.ErrCodeForbidden, "can only modify grades for own courses")
	}
	return nil
}

func (s *gradeService) UpsertByCourse(courseNo string, items []GradeItem, role string, userID uint) error {
	if courseNo == "" || len(items) == 0 {
		return pkg.NewAppError(pkg.ErrCodeMissingRequired, "course_no/items required")
	}

	course, err := s.courseRepo.FindByCourseNo(courseNo)
	if err != nil {
		return pkg.NewAppError(pkg.ErrCodeGradeCourseNF, "course not found")
	}

	// Teacher can only modify grades for own courses
	if role == "teacher" {
		if err := s.checkTeacherCoursePermission(userID, course.ID); err != nil {
			return err
		}
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		txGradeRepo := s.gradeRepo.WithTx(tx)
		for _, item := range items {
			student, err := s.studentRepo.FindByStudentNo(item.StudentNo)
			if err != nil {
				return pkg.NewAppError(pkg.ErrCodeGradeStudentNF, "student not found: "+item.StudentNo)
			}

			grade := &model.Grade{
				StudentID:  student.ID,
				CourseID:   course.ID,
				UsualScore: item.UsualScore,
				ExamScore:  item.ExamScore,
				FinalScore: item.FinalScore,
			}
			if err := txGradeRepo.Upsert(grade); err != nil {
				return pkg.WrapError(pkg.ErrCodeGradeUpsertFail, "upsert failed", err)
			}
		}
		return nil
	})
}

func (s *gradeService) UpsertByStudent(studentNo string, items []GradeItem, role string, userID uint) error {
	if studentNo == "" || len(items) == 0 {
		return pkg.NewAppError(pkg.ErrCodeMissingRequired, "student_no/items required")
	}

	student, err := s.studentRepo.FindByStudentNo(studentNo)
	if err != nil {
		return pkg.NewAppError(pkg.ErrCodeGradeStudentNF, "student not found")
	}

	// If teacher, check permission for each course
	if role == "teacher" {
		for _, item := range items {
			course, err := s.courseRepo.FindByCourseNo(item.CourseNo)
			if err != nil {
				return pkg.NewAppError(pkg.ErrCodeGradeCourseNF, "course not found: "+item.CourseNo)
			}
			if err := s.checkTeacherCoursePermission(userID, course.ID); err != nil {
				return err
			}
		}
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		txGradeRepo := s.gradeRepo.WithTx(tx)
		for _, item := range items {
			course, err := s.courseRepo.FindByCourseNo(item.CourseNo)
			if err != nil {
				return pkg.NewAppError(pkg.ErrCodeGradeCourseNF, "course not found: "+item.CourseNo)
			}

			grade := &model.Grade{
				StudentID:  student.ID,
				CourseID:   course.ID,
				UsualScore: item.UsualScore,
				ExamScore:  item.ExamScore,
				FinalScore: item.FinalScore,
			}
			if err := txGradeRepo.Upsert(grade); err != nil {
				return pkg.WrapError(pkg.ErrCodeGradeUpsertFail, "upsert failed", err)
			}
		}
		return nil
	})
}
