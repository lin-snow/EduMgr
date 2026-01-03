package repository

import (
	"github.com/lin-snow/edumgr/internal/model"
	"gorm.io/gorm"
)

// StaffWithDept represents a staff member with department info
type StaffWithDept struct {
	model.Staff
	DeptNo string `json:"dept_no"`
}

// StaffQueryParams represents staff query parameters
type StaffQueryParams struct {
	StaffNo  string
	Name     string
	DeptNo   string
	Page     int
	PageSize int
}

// StaffRepository defines the interface for staff data access
type StaffRepository interface {
	FindAll(staffNo, name, deptNo string) ([]StaffWithDept, error)
	FindAllPaginated(params StaffQueryParams) ([]StaffWithDept, int64, error)
	FindByID(id uint) (*model.Staff, error)
	FindByStaffNo(staffNo string) (*model.Staff, error)
	Create(staff *model.Staff) error
	Update(staff *model.Staff) error
	Delete(id uint) error
	CountCourses(staffID uint) (int64, error)
}

type staffRepo struct {
	db *gorm.DB
}

// NewStaffRepository creates a new StaffRepository
func NewStaffRepository(db *gorm.DB) StaffRepository {
	return &staffRepo{db: db}
}

func (r *staffRepo) FindAll(staffNo, name, deptNo string) ([]StaffWithDept, error) {
	q := r.db.Table("staff").
		Select("staff.*, departments.dept_no AS dept_no").
		Joins("JOIN departments ON departments.id = staff.dept_id")

	if staffNo != "" {
		q = q.Where("staff.staff_no = ?", staffNo)
	}
	if name != "" {
		q = q.Where("staff.name ILIKE ?", "%"+name+"%")
	}
	if deptNo != "" {
		q = q.Where("departments.dept_no = ?", deptNo)
	}

	var items []StaffWithDept
	if err := q.Order("staff.staff_no asc").Scan(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *staffRepo) FindAllPaginated(params StaffQueryParams) ([]StaffWithDept, int64, error) {
	q := r.db.Table("staff").
		Select("staff.*, departments.dept_no AS dept_no").
		Joins("JOIN departments ON departments.id = staff.dept_id")

	if params.StaffNo != "" {
		q = q.Where("staff.staff_no = ?", params.StaffNo)
	}
	if params.Name != "" {
		q = q.Where("staff.name ILIKE ?", "%"+params.Name+"%")
	}
	if params.DeptNo != "" {
		q = q.Where("departments.dept_no = ?", params.DeptNo)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		q = q.Offset(offset).Limit(params.PageSize)
	}

	var items []StaffWithDept
	if err := q.Order("staff.staff_no asc").Scan(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *staffRepo) FindByID(id uint) (*model.Staff, error) {
	var staff model.Staff
	if err := r.db.First(&staff, id).Error; err != nil {
		return nil, err
	}
	return &staff, nil
}

func (r *staffRepo) FindByStaffNo(staffNo string) (*model.Staff, error) {
	var staff model.Staff
	if err := r.db.Where("staff_no = ?", staffNo).First(&staff).Error; err != nil {
		return nil, err
	}
	return &staff, nil
}

func (r *staffRepo) Create(staff *model.Staff) error {
	return r.db.Create(staff).Error
}

func (r *staffRepo) Update(staff *model.Staff) error {
	return r.db.Save(staff).Error
}

func (r *staffRepo) Delete(id uint) error {
	return r.db.Delete(&model.Staff{}, id).Error
}

func (r *staffRepo) CountCourses(staffID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.Course{}).Where("teacher_id = ?", staffID).Count(&count).Error
	return count, err
}
