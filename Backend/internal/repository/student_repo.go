package repository

import (
	"github.com/lin-snow/edumgr/internal/model"
	"gorm.io/gorm"
)

// StudentWithDept represents a student with department info
type StudentWithDept struct {
	model.Student
	DeptNo string `json:"dept_no"`
}

// StudentQueryParams represents student query parameters
type StudentQueryParams struct {
	StudentNo string
	Name      string
	DeptNo    string
	Page      int
	PageSize  int
}

// StudentRepository defines the interface for student data access
type StudentRepository interface {
	FindAll(studentNo, name, deptNo string) ([]StudentWithDept, error)
	FindAllPaginated(params StudentQueryParams) ([]StudentWithDept, int64, error)
	FindByID(id uint) (*model.Student, error)
	FindByStudentNo(studentNo string) (*model.Student, error)
	FindByStudentNos(studentNos []string) ([]model.Student, error)
	Create(student *model.Student) error
	Update(student *model.Student) error
	Delete(id uint) error
	CreateHistory(history *model.StudentHistory) error
	WithTx(tx *gorm.DB) StudentRepository
}

type studentRepo struct {
	db *gorm.DB
}

// NewStudentRepository creates a new StudentRepository
func NewStudentRepository(db *gorm.DB) StudentRepository {
	return &studentRepo{db: db}
}

func (r *studentRepo) WithTx(tx *gorm.DB) StudentRepository {
	return &studentRepo{db: tx}
}

func (r *studentRepo) FindAll(studentNo, name, deptNo string) ([]StudentWithDept, error) {
	q := r.db.Table("students").
		Select("students.*, departments.dept_no AS dept_no").
		Joins("JOIN departments ON departments.id = students.dept_id")

	if studentNo != "" {
		q = q.Where("students.student_no = ?", studentNo)
	}
	if name != "" {
		q = q.Where("students.name ILIKE ?", "%"+name+"%")
	}
	if deptNo != "" {
		q = q.Where("departments.dept_no = ?", deptNo)
	}

	var items []StudentWithDept
	if err := q.Order("students.student_no asc").Scan(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *studentRepo) FindAllPaginated(params StudentQueryParams) ([]StudentWithDept, int64, error) {
	q := r.db.Table("students").
		Select("students.*, departments.dept_no AS dept_no").
		Joins("JOIN departments ON departments.id = students.dept_id")

	if params.StudentNo != "" {
		q = q.Where("students.student_no = ?", params.StudentNo)
	}
	if params.Name != "" {
		q = q.Where("students.name ILIKE ?", "%"+params.Name+"%")
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

	var items []StudentWithDept
	if err := q.Order("students.student_no asc").Scan(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *studentRepo) FindByID(id uint) (*model.Student, error) {
	var student model.Student
	if err := r.db.First(&student, id).Error; err != nil {
		return nil, err
	}
	return &student, nil
}

func (r *studentRepo) FindByStudentNo(studentNo string) (*model.Student, error) {
	var student model.Student
	if err := r.db.Where("student_no = ?", studentNo).First(&student).Error; err != nil {
		return nil, err
	}
	return &student, nil
}

func (r *studentRepo) FindByStudentNos(studentNos []string) ([]model.Student, error) {
	var students []model.Student
	if err := r.db.Where("student_no IN ?", studentNos).Find(&students).Error; err != nil {
		return nil, err
	}
	return students, nil
}

func (r *studentRepo) Create(student *model.Student) error {
	return r.db.Create(student).Error
}

func (r *studentRepo) Update(student *model.Student) error {
	return r.db.Save(student).Error
}

func (r *studentRepo) Delete(id uint) error {
	return r.db.Delete(&model.Student{}, id).Error
}

func (r *studentRepo) CreateHistory(history *model.StudentHistory) error {
	return r.db.Create(history).Error
}
