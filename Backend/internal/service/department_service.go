package service

import (
	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

// DepartmentService defines the interface for department business logic
type DepartmentService interface {
	List(deptNo, name string) ([]model.Department, error)
	GetByID(id uint) (*model.Department, error)
	Create(dept *model.Department) error
	Update(id uint, input *model.Department) (*model.Department, error)
	Delete(id uint) error
}

type departmentService struct {
	repo repository.DepartmentRepository
}

// NewDepartmentService creates a new DepartmentService
func NewDepartmentService(repo repository.DepartmentRepository) DepartmentService {
	return &departmentService{repo: repo}
}

func (s *departmentService) List(deptNo, name string) ([]model.Department, error) {
	items, err := s.repo.FindAll(deptNo, name)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	return items, nil
}

func (s *departmentService) GetByID(id uint) (*model.Department, error) {
	dept, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "department not found", err)
	}
	return dept, nil
}

func (s *departmentService) Create(dept *model.Department) error {
	if dept.DeptNo == "" || dept.Name == "" {
		return pkg.NewAppError(pkg.ErrCodeMissingRequired, "dept_no/name required")
	}
	dept.ID = 0
	if err := s.repo.Create(dept); err != nil {
		return pkg.WrapError(pkg.ErrCodeCreateFailed, "create failed", err)
	}
	return nil
}

func (s *departmentService) Update(id uint, input *model.Department) (*model.Department, error) {
	current, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "department not found", err)
	}

	// Keep dept_no immutable to avoid breaking FKs
	if input.Name != "" {
		current.Name = input.Name
	}
	current.Intro = input.Intro

	if err := s.repo.Update(current); err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeUpdateFailed, "update failed", err)
	}
	return current, nil
}

func (s *departmentService) Delete(id uint) error {
	// PRD: 删除系前需校验是否存在关联学生、教师或课程
	stuCnt, err := s.repo.CountStudents(id)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	if stuCnt > 0 {
		return pkg.NewAppError(pkg.ErrCodeDeptHasStudents, "department has students")
	}

	staffCnt, err := s.repo.CountStaff(id)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	if staffCnt > 0 {
		return pkg.NewAppError(pkg.ErrCodeDeptHasStaff, "department has staff")
	}

	if err := s.repo.Delete(id); err != nil {
		return pkg.WrapError(pkg.ErrCodeDeleteFailed, "delete failed", err)
	}
	return nil
}
