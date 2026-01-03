package service

import (
	"time"

	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

// StudentListResult represents paginated student list
type StudentListResult struct {
	Items    []repository.StudentWithDept `json:"items"`
	Total    int64                        `json:"total"`
	Page     int                          `json:"page"`
	PageSize int                          `json:"page_size"`
}

// StudentService defines the interface for student business logic
type StudentService interface {
	List(studentNo, name, deptNo string) ([]repository.StudentWithDept, error)
	ListPaginated(studentNo, name, deptNo string, page, pageSize int) (*StudentListResult, error)
	GetByID(id uint) (*model.Student, error)
	GetMyInfo(userID uint) (*repository.StudentWithDept, error)
	Create(student *model.Student) error
	Update(id uint, input *model.Student) (*model.Student, error)
	Delete(id uint) error
	Graduate(id uint) error
	TransferOut(id uint) error
	TransferIn(id uint) (*model.Student, error)
}

type studentService struct {
	repo     repository.StudentRepository
	userRepo repository.UserRepository
	db       *gorm.DB
}

// NewStudentService creates a new StudentService
func NewStudentService(repo repository.StudentRepository, userRepo repository.UserRepository, db *gorm.DB) StudentService {
	return &studentService{repo: repo, userRepo: userRepo, db: db}
}

func (s *studentService) List(studentNo, name, deptNo string) ([]repository.StudentWithDept, error) {
	items, err := s.repo.FindAll(studentNo, name, deptNo)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	return items, nil
}

func (s *studentService) ListPaginated(studentNo, name, deptNo string, page, pageSize int) (*StudentListResult, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.StudentQueryParams{
		StudentNo: studentNo,
		Name:      name,
		DeptNo:    deptNo,
		Page:      page,
		PageSize:  pageSize,
	}

	items, total, err := s.repo.FindAllPaginated(params)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}

	return &StudentListResult{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *studentService) GetByID(id uint) (*model.Student, error) {
	student, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "student not found", err)
	}
	return student, nil
}

func (s *studentService) GetMyInfo(userID uint) (*repository.StudentWithDept, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil || user.StudentID == nil {
		return nil, pkg.NewAppError(pkg.ErrCodeStudentNotBound, "student not bound")
	}

	student, err := s.repo.FindByID(*user.StudentID)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "student not found", err)
	}

	// Get with dept info
	items, err := s.repo.FindAll(student.StudentNo, "", "")
	if err != nil || len(items) == 0 {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "student not found", err)
	}
	return &items[0], nil
}

func (s *studentService) Create(student *model.Student) error {
	if student.StudentNo == "" || student.Name == "" || student.DeptID == 0 {
		return pkg.NewAppError(pkg.ErrCodeMissingRequired, "student_no/name/dept_id required")
	}
	student.ID = 0
	if err := s.repo.Create(student); err != nil {
		return pkg.WrapError(pkg.ErrCodeCreateFailed, "create failed", err)
	}
	return nil
}

func (s *studentService) Update(id uint, input *model.Student) (*model.Student, error) {
	current, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "student not found", err)
	}

	// student_no immutable (PRD: 学号唯一且不允许修改)
	if input.Name != "" {
		current.Name = input.Name
	}
	current.Gender = input.Gender
	current.BirthDate = input.BirthDate
	current.EntryScore = input.EntryScore
	if input.DeptID != 0 {
		current.DeptID = input.DeptID
	}
	if input.Status != "" {
		current.Status = input.Status
	}

	if err := s.repo.Update(current); err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeUpdateFailed, "update failed", err)
	}
	return current, nil
}

func (s *studentService) Delete(id uint) error {
	if err := s.repo.Delete(id); err != nil {
		return pkg.WrapError(pkg.ErrCodeDeleteFailed, "delete failed", err)
	}
	return nil
}

func (s *studentService) Graduate(id uint) error {
	return s.archiveStudent(id, "graduated", "graduate")
}

func (s *studentService) TransferOut(id uint) error {
	return s.archiveStudent(id, "transfer_out", "transfer_out")
}

func (s *studentService) TransferIn(id uint) (*model.Student, error) {
	student, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "student not found", err)
	}
	student.Status = "transfer_in"
	if err := s.repo.Update(student); err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeUpdateFailed, "update failed", err)
	}
	return student, nil
}

func (s *studentService) archiveStudent(id uint, newStatus string, reason string) error {
	student, err := s.repo.FindByID(id)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeNotFound, "student not found", err)
	}

	now := time.Now()
	history := model.StudentHistory{
		StudentNo:     student.StudentNo,
		Name:          student.Name,
		Gender:        student.Gender,
		BirthDate:     student.BirthDate,
		EntryScore:    student.EntryScore,
		DeptID:        student.DeptID,
		Status:        newStatus,
		ArchivedAt:    now,
		ArchiveReason: reason,
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithTx(tx)
		if err := txRepo.CreateHistory(&history); err != nil {
			return err
		}
		student.Status = newStatus
		if err := txRepo.Update(student); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return pkg.WrapError(pkg.ErrCodeArchiveFailed, "archive failed", err)
	}
	return nil
}
