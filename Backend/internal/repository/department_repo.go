package repository

import (
	"github.com/lin-snow/edumgr/internal/model"
	"gorm.io/gorm"
)

// DepartmentRepository defines the interface for department data access
type DepartmentRepository interface {
	FindAll(deptNo, name string) ([]model.Department, error)
	FindByID(id uint) (*model.Department, error)
	FindByDeptNo(deptNo string) (*model.Department, error)
	Create(dept *model.Department) error
	Update(dept *model.Department) error
	Delete(id uint) error
	CountStudents(deptID uint) (int64, error)
	CountStaff(deptID uint) (int64, error)
}

type departmentRepo struct {
	db *gorm.DB
}

// NewDepartmentRepository creates a new DepartmentRepository
func NewDepartmentRepository(db *gorm.DB) DepartmentRepository {
	return &departmentRepo{db: db}
}

func (r *departmentRepo) FindAll(deptNo, name string) ([]model.Department, error) {
	q := r.db.Model(&model.Department{})
	if deptNo != "" {
		q = q.Where("dept_no = ?", deptNo)
	}
	if name != "" {
		q = q.Where("name ILIKE ?", "%"+name+"%")
	}

	var items []model.Department
	if err := q.Order("dept_no asc").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *departmentRepo) FindByID(id uint) (*model.Department, error) {
	var dept model.Department
	if err := r.db.First(&dept, id).Error; err != nil {
		return nil, err
	}
	return &dept, nil
}

func (r *departmentRepo) FindByDeptNo(deptNo string) (*model.Department, error) {
	var dept model.Department
	if err := r.db.Where("dept_no = ?", deptNo).First(&dept).Error; err != nil {
		return nil, err
	}
	return &dept, nil
}

func (r *departmentRepo) Create(dept *model.Department) error {
	return r.db.Create(dept).Error
}

func (r *departmentRepo) Update(dept *model.Department) error {
	return r.db.Save(dept).Error
}

func (r *departmentRepo) Delete(id uint) error {
	return r.db.Delete(&model.Department{}, id).Error
}

func (r *departmentRepo) CountStudents(deptID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.Student{}).Where("dept_id = ?", deptID).Count(&count).Error
	return count, err
}

func (r *departmentRepo) CountStaff(deptID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.Staff{}).Where("dept_id = ?", deptID).Count(&count).Error
	return count, err
}
