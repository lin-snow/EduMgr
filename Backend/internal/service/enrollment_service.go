package service

import (
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

const MaxCreditsPerTerm = 15

// EnrollRequest represents the enrollment request
type EnrollRequest struct {
	TermCode   string
	StudentNo  string
	StudentNos []string
	CourseNos  []string
}

// EnrollResult represents the result of an enrollment
type EnrollResult struct {
	StudentID uint   `json:"student_id"`
	TermID    uint   `json:"term_id"`
	CourseIDs []uint `json:"course_ids"`
}

// EnrollmentListResult represents paginated enrollment list
type EnrollmentListResult struct {
	Items []repository.EnrollmentRow `json:"items"`
	Total int64                      `json:"total"`
	Page  int                        `json:"page"`
	Size  int                        `json:"size"`
}

// EnrollmentService defines the interface for enrollment business logic
type EnrollmentService interface {
	List(studentNo, courseNo, termCode string, page, pageSize int) (*EnrollmentListResult, error)
	ListByStudent(role string, userID uint, studentNo string) ([]repository.EnrollmentRow, error)
	Enroll(req EnrollRequest, role string, userID uint) ([]EnrollResult, error)
	Delete(id uint, role string, userID uint) error
}

type enrollmentService struct {
	enrollRepo  repository.EnrollmentRepository
	termRepo    repository.TermRepository
	courseRepo  repository.CourseRepository
	studentRepo repository.StudentRepository
	userRepo    repository.UserRepository
	db          *gorm.DB
}

// NewEnrollmentService creates a new EnrollmentService
func NewEnrollmentService(
	enrollRepo repository.EnrollmentRepository,
	termRepo repository.TermRepository,
	courseRepo repository.CourseRepository,
	studentRepo repository.StudentRepository,
	userRepo repository.UserRepository,
	db *gorm.DB,
) EnrollmentService {
	return &enrollmentService{
		enrollRepo:  enrollRepo,
		termRepo:    termRepo,
		courseRepo:  courseRepo,
		studentRepo: studentRepo,
		userRepo:    userRepo,
		db:          db,
	}
}

func (s *enrollmentService) List(studentNo, courseNo, termCode string, page, pageSize int) (*EnrollmentListResult, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.EnrollmentQueryParams{
		StudentNo: studentNo,
		CourseNo:  courseNo,
		TermCode:  termCode,
		Page:      page,
		PageSize:  pageSize,
	}

	items, total, err := s.enrollRepo.FindByFilters(params)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}

	return &EnrollmentListResult{
		Items: items,
		Total: total,
		Page:  page,
		Size:  pageSize,
	}, nil
}

func (s *enrollmentService) ListByStudent(role string, userID uint, studentNo string) ([]repository.EnrollmentRow, error) {
	var studentID uint

	if role == "student" {
		// Student can only view own enrollments
		user, err := s.userRepo.FindByID(userID)
		if err != nil || user.StudentID == nil {
			return nil, pkg.NewAppError(pkg.ErrCodeStudentNotBound, "student not bound")
		}
		studentID = *user.StudentID
	} else if role == "admin" || role == "teacher" {
		if studentNo == "" {
			return nil, pkg.NewAppError(pkg.ErrCodeMissingRequired, "student_no required")
		}
		student, err := s.studentRepo.FindByStudentNo(studentNo)
		if err != nil {
			return nil, pkg.NewAppError(pkg.ErrCodeStudentNotFound, "student not found")
		}
		studentID = student.ID
	} else {
		return nil, pkg.NewAppError(pkg.ErrCodeForbidden, "forbidden")
	}

	items, err := s.enrollRepo.FindByStudentID(studentID)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	return items, nil
}

func (s *enrollmentService) Enroll(req EnrollRequest, role string, userID uint) ([]EnrollResult, error) {
	if req.TermCode == "" || len(req.CourseNos) == 0 {
		return nil, pkg.NewAppError(pkg.ErrCodeMissingRequired, "term_code/course_nos required")
	}

	// Resolve term
	term, err := s.termRepo.FindByTermCode(req.TermCode)
	if err != nil {
		return nil, pkg.NewAppError(pkg.ErrCodeTermNotFound, "term not found")
	}

	// Resolve courses
	courseRows, err := s.courseRepo.FindByCourseNos(req.CourseNos)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	if len(courseRows) != len(req.CourseNos) {
		return nil, pkg.NewAppError(pkg.ErrCodeCourseNotFound, "some courses not found")
	}

	courseIDs := make([]uint, 0, len(courseRows))
	courseCredit := make(map[uint]int)
	for _, r := range courseRows {
		courseIDs = append(courseIDs, r.ID)
		courseCredit[r.ID] = r.Credits
	}

	// Resolve students based on role
	var studentIDs []uint
	switch role {
	case "admin":
		studentNos := req.StudentNos
		if len(studentNos) == 0 {
			if req.StudentNo == "" {
				return nil, pkg.NewAppError(pkg.ErrCodeMissingRequired, "student_no or student_nos required")
			}
			studentNos = []string{req.StudentNo}
		}
		students, err := s.studentRepo.FindByStudentNos(studentNos)
		if err != nil {
			return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
		}
		if len(students) != len(studentNos) {
			return nil, pkg.NewAppError(pkg.ErrCodeStudentNotFound, "some students not found")
		}
		for _, stu := range students {
			studentIDs = append(studentIDs, stu.ID)
		}
	case "student":
		// Student can only enroll self
		user, err := s.userRepo.FindByID(userID)
		if err != nil || user.StudentID == nil {
			return nil, pkg.NewAppError(pkg.ErrCodeStudentNotBound, "student not bound")
		}
		studentIDs = []uint{*user.StudentID}
	default:
		return nil, pkg.NewAppError(pkg.ErrCodeForbidden, "forbidden")
	}

	// Process enrollments
	var results []EnrollResult
	for _, sid := range studentIDs {
		err := s.db.Transaction(func(tx *gorm.DB) error {
			txEnrollRepo := s.enrollRepo.WithTx(tx)

			// Get current credits
			currentCredits, err := txEnrollRepo.GetCurrentCredits(sid, term.ID)
			if err != nil {
				return err
			}

			// Check for duplicates
			dupCnt, err := txEnrollRepo.CountDuplicates(sid, courseIDs)
			if err != nil {
				return err
			}
			if dupCnt > 0 {
				return pkg.NewAppError(pkg.ErrCodeDuplicateEnroll, "duplicate enrollment")
			}

			// Calculate additional credits
			addCredits := 0
			for _, cid := range courseIDs {
				addCredits += courseCredit[cid]
			}
			if currentCredits+addCredits > MaxCreditsPerTerm {
				return pkg.NewAppError(pkg.ErrCodeCreditExceeded, "credit limit exceeded")
			}

			// Create enrollments
			enrollments := make([]model.Enrollment, 0, len(courseIDs))
			for _, cid := range courseIDs {
				enrollments = append(enrollments, model.Enrollment{
					StudentID: sid,
					CourseID:  cid,
					TermID:    term.ID,
				})
			}
			if err := txEnrollRepo.CreateBatch(enrollments); err != nil {
				return err
			}

			results = append(results, EnrollResult{
				StudentID: sid,
				TermID:    term.ID,
				CourseIDs: courseIDs,
			})
			return nil
		})
		if err != nil {
			if appErr, ok := err.(*pkg.AppError); ok {
				return nil, appErr
			}
			return nil, pkg.WrapError(pkg.ErrCodeEnrollFailed, "enroll failed", err)
		}
	}

	return results, nil
}

func (s *enrollmentService) Delete(id uint, role string, userID uint) error {
	// Load enrollment
	enrollment, err := s.enrollRepo.FindByID(id)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeNotFound, "enrollment not found", err)
	}

	// Permission check
	if role == "student" {
		user, err := s.userRepo.FindByID(userID)
		if err != nil || user.StudentID == nil || *user.StudentID != enrollment.StudentID {
			return pkg.NewAppError(pkg.ErrCodeForbidden, "forbidden")
		}
	} else if role != "admin" {
		return pkg.NewAppError(pkg.ErrCodeForbidden, "forbidden")
	}

	// PRD: 删除选课记录时需同步处理成绩数据
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		txEnrollRepo := s.enrollRepo.WithTx(tx)
		if err := txEnrollRepo.DeleteGradesByStudentAndCourse(enrollment.StudentID, enrollment.CourseID); err != nil {
			return err
		}
		if err := txEnrollRepo.Delete(enrollment.ID); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return pkg.WrapError(pkg.ErrCodeEnrollDelFailed, "delete failed", err)
	}

	return nil
}
