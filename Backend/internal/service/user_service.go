package service

import (
	"golang.org/x/crypto/bcrypt"

	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

// CreateUserRequest represents the request to create a user
type CreateUserRequest struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	Role      string `json:"role"`
	StudentID *uint  `json:"student_id,omitempty"`
	StaffID   *uint  `json:"staff_id,omitempty"`
}

// UserInfo represents user information
type UserInfo struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	StudentID *uint  `json:"student_id,omitempty"`
	StaffID   *uint  `json:"staff_id,omitempty"`
}

// UserService defines the interface for user management business logic
type UserService interface {
	List() ([]UserInfo, error)
	GetByID(id uint) (*UserInfo, error)
	Create(req CreateUserRequest) (*UserInfo, error)
	Update(id uint, req CreateUserRequest) (*UserInfo, error)
	Delete(id uint) error
	ResetPassword(id uint, newPassword string) error
}

type userService struct {
	userRepo repository.UserRepository
}

// NewUserService creates a new UserService
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) List() ([]UserInfo, error) {
	users, err := s.userRepo.FindAll()
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}

	result := make([]UserInfo, len(users))
	for i, u := range users {
		result[i] = UserInfo{
			ID:        u.ID,
			Username:  u.Username,
			Role:      u.Role,
			StudentID: u.StudentID,
			StaffID:   u.StaffID,
		}
	}
	return result, nil
}

func (s *userService) GetByID(id uint) (*UserInfo, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "user not found", err)
	}

	return &UserInfo{
		ID:        user.ID,
		Username:  user.Username,
		Role:      user.Role,
		StudentID: user.StudentID,
		StaffID:   user.StaffID,
	}, nil
}

func (s *userService) Create(req CreateUserRequest) (*UserInfo, error) {
	if req.Username == "" || req.Password == "" || req.Role == "" {
		return nil, pkg.NewAppError(pkg.ErrCodeMissingRequired, "username/password/role required")
	}

	// Validate role
	if req.Role != "admin" && req.Role != "teacher" && req.Role != "student" {
		return nil, pkg.NewAppError(pkg.ErrCodeMissingRequired, "role must be admin/teacher/student")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeCreateFailed, "hash password failed", err)
	}

	user := &model.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		Role:         req.Role,
		StudentID:    req.StudentID,
		StaffID:      req.StaffID,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeCreateFailed, "create user failed", err)
	}

	return &UserInfo{
		ID:        user.ID,
		Username:  user.Username,
		Role:      user.Role,
		StudentID: user.StudentID,
		StaffID:   user.StaffID,
	}, nil
}

func (s *userService) Update(id uint, req CreateUserRequest) (*UserInfo, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "user not found", err)
	}

	if req.Username != "" {
		user.Username = req.Username
	}
	if req.Role != "" {
		if req.Role != "admin" && req.Role != "teacher" && req.Role != "student" {
			return nil, pkg.NewAppError(pkg.ErrCodeMissingRequired, "role must be admin/teacher/student")
		}
		user.Role = req.Role
	}
	user.StudentID = req.StudentID
	user.StaffID = req.StaffID

	if err := s.userRepo.Update(user); err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeUpdateFailed, "update user failed", err)
	}

	return &UserInfo{
		ID:        user.ID,
		Username:  user.Username,
		Role:      user.Role,
		StudentID: user.StudentID,
		StaffID:   user.StaffID,
	}, nil
}

func (s *userService) Delete(id uint) error {
	if err := s.userRepo.Delete(id); err != nil {
		return pkg.WrapError(pkg.ErrCodeDeleteFailed, "delete user failed", err)
	}
	return nil
}

func (s *userService) ResetPassword(id uint, newPassword string) error {
	if newPassword == "" {
		return pkg.NewAppError(pkg.ErrCodeMissingRequired, "password required")
	}

	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeNotFound, "user not found", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeUpdateFailed, "hash password failed", err)
	}

	user.PasswordHash = string(hash)
	if err := s.userRepo.Update(user); err != nil {
		return pkg.WrapError(pkg.ErrCodeUpdateFailed, "update password failed", err)
	}
	return nil
}
