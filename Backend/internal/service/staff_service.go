package service

import (
	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

// StaffListResult represents paginated staff list
type StaffListResult struct {
	Items    []repository.StaffWithDept `json:"items"`
	Total    int64                      `json:"total"`
	Page     int                        `json:"page"`
	PageSize int                        `json:"page_size"`
}

// StaffService defines the interface for staff business logic
type StaffService interface {
	List(staffNo, name, deptNo string) ([]repository.StaffWithDept, error)
	ListPaginated(staffNo, name, deptNo string, page, pageSize int) (*StaffListResult, error)
	GetByID(id uint) (*model.Staff, error)
	Create(staff *model.Staff) error
	Update(id uint, input *model.Staff) (*model.Staff, error)
	Delete(id uint) error
}

type staffService struct {
	repo repository.StaffRepository
}

// NewStaffService creates a new StaffService
func NewStaffService(repo repository.StaffRepository) StaffService {
	return &staffService{repo: repo}
}

func (s *staffService) List(staffNo, name, deptNo string) ([]repository.StaffWithDept, error) {
	items, err := s.repo.FindAll(staffNo, name, deptNo)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	return items, nil
}

func (s *staffService) ListPaginated(staffNo, name, deptNo string, page, pageSize int) (*StaffListResult, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.StaffQueryParams{
		StaffNo:  staffNo,
		Name:     name,
		DeptNo:   deptNo,
		Page:     page,
		PageSize: pageSize,
	}

	items, total, err := s.repo.FindAllPaginated(params)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}

	return &StaffListResult{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *staffService) GetByID(id uint) (*model.Staff, error) {
	staff, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "staff not found", err)
	}
	return staff, nil
}

func (s *staffService) Create(staff *model.Staff) error {
	if staff.StaffNo == "" || staff.Name == "" || staff.DeptID == 0 {
		return pkg.NewAppError(pkg.ErrCodeMissingRequired, "staff_no/name/dept_id required")
	}
	staff.ID = 0
	if err := s.repo.Create(staff); err != nil {
		return pkg.WrapError(pkg.ErrCodeCreateFailed, "create failed", err)
	}
	return nil
}

func (s *staffService) Update(id uint, input *model.Staff) (*model.Staff, error) {
	current, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "staff not found", err)
	}

	// staff_no immutable
	if input.Name != "" {
		current.Name = input.Name
	}
	current.Gender = input.Gender
	current.BirthMonth = input.BirthMonth
	if input.DeptID != 0 {
		current.DeptID = input.DeptID
	}
	current.Title = input.Title
	current.Major = input.Major
	current.TeachingDirection = input.TeachingDirection

	if err := s.repo.Update(current); err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeUpdateFailed, "update failed", err)
	}
	return current, nil
}

func (s *staffService) Delete(id uint) error {
	// PRD: 删除教师前需校验是否仍承担课程
	courseCnt, err := s.repo.CountCourses(id)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	if courseCnt > 0 {
		return pkg.NewAppError(pkg.ErrCodeStaffHasCourses, "staff still teaches courses")
	}

	if err := s.repo.Delete(id); err != nil {
		return pkg.WrapError(pkg.ErrCodeDeleteFailed, "delete failed", err)
	}
	return nil
}
