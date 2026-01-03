package service

import (
	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

// CourseListResult represents paginated course list
type CourseListResult struct {
	Items    []repository.CourseWithTeacher `json:"items"`
	Total    int64                          `json:"total"`
	Page     int                            `json:"page"`
	PageSize int                            `json:"page_size"`
}

// CourseService defines the interface for course business logic
type CourseService interface {
	List(courseNo, name, teacherName string) ([]repository.CourseWithTeacher, error)
	ListPaginated(courseNo, name, teacherName string, page, pageSize int) (*CourseListResult, error)
	GetByID(id uint) (*model.Course, error)
	Create(course *model.Course) error
	Update(id uint, input *model.Course) (*model.Course, error)
	Delete(id uint) error
}

type courseService struct {
	repo repository.CourseRepository
}

// NewCourseService creates a new CourseService
func NewCourseService(repo repository.CourseRepository) CourseService {
	return &courseService{repo: repo}
}

func (s *courseService) List(courseNo, name, teacherName string) ([]repository.CourseWithTeacher, error) {
	items, err := s.repo.FindAll(courseNo, name, teacherName)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	return items, nil
}

func (s *courseService) ListPaginated(courseNo, name, teacherName string, page, pageSize int) (*CourseListResult, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.CourseQueryParams{
		CourseNo:    courseNo,
		Name:        name,
		TeacherName: teacherName,
		Page:        page,
		PageSize:    pageSize,
	}

	items, total, err := s.repo.FindAllPaginated(params)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}

	return &CourseListResult{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *courseService) GetByID(id uint) (*model.Course, error) {
	course, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "course not found", err)
	}
	return course, nil
}

func (s *courseService) Create(course *model.Course) error {
	if course.CourseNo == "" || course.Name == "" || course.TeacherID == 0 {
		return pkg.NewAppError(pkg.ErrCodeMissingRequired, "course_no/name/teacher_id required")
	}
	course.ID = 0
	if err := s.repo.Create(course); err != nil {
		return pkg.WrapError(pkg.ErrCodeCreateFailed, "create failed", err)
	}
	return nil
}

func (s *courseService) Update(id uint, input *model.Course) (*model.Course, error) {
	current, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "course not found", err)
	}

	// course_no immutable
	if input.Name != "" {
		current.Name = input.Name
	}
	if input.TeacherID != 0 {
		current.TeacherID = input.TeacherID
	}
	current.Hours = input.Hours
	current.Credits = input.Credits
	current.ClassTime = input.ClassTime
	current.ClassLocation = input.ClassLocation
	current.ExamTime = input.ExamTime

	if err := s.repo.Update(current); err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeUpdateFailed, "update failed", err)
	}
	return current, nil
}

func (s *courseService) Delete(id uint) error {
	// 避免破坏选课/成绩一致性
	enrCnt, err := s.repo.CountEnrollments(id)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	if enrCnt > 0 {
		return pkg.NewAppError(pkg.ErrCodeCourseHasEnroll, "course has enrollments")
	}

	grdCnt, err := s.repo.CountGrades(id)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	if grdCnt > 0 {
		return pkg.NewAppError(pkg.ErrCodeCourseHasGrades, "course has grades")
	}

	if err := s.repo.Delete(id); err != nil {
		return pkg.WrapError(pkg.ErrCodeDeleteFailed, "delete failed", err)
	}
	return nil
}
