package service

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/lin-snow/edumgr/internal/config"
	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

// LoginResponse represents the login response
type LoginResponse struct {
	Token string      `json:"token"`
	User  UserSummary `json:"user"`
}

// UserSummary represents user summary info
type UserSummary struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	StudentID *uint  `json:"student_id,omitempty"`
	StaffID   *uint  `json:"staff_id,omitempty"`
}

// AuthService defines the interface for authentication business logic
type AuthService interface {
	Login(username, password string) (*LoginResponse, error)
	GetCurrentUser(userID uint) (*UserSummary, error)
	CreateUser(user *model.User, password string) error
}

type authService struct {
	userRepo repository.UserRepository
	cfg      config.Config
}

// NewAuthService creates a new AuthService
func NewAuthService(userRepo repository.UserRepository, cfg config.Config) AuthService {
	return &authService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (s *authService) Login(username, password string) (*LoginResponse, error) {
	if username == "" || password == "" {
		return nil, pkg.NewAppError(pkg.ErrCodeMissingRequired, "username/password required")
	}

	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return nil, pkg.NewAppError(pkg.ErrCodeInvalidCredentials, "invalid username or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, pkg.NewAppError(pkg.ErrCodeInvalidCredentials, "invalid username or password")
	}

	// Generate JWT
	now := time.Now()
	exp := now.Add(time.Duration(s.cfg.JWTExpiresMinutes) * time.Minute)

	claims := jwt.MapClaims{
		"sub":     user.ID,
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     exp.Unix(),
		"iat":     now.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeSignToken, "sign token failed", err)
	}

	return &LoginResponse{
		Token: signed,
		User: UserSummary{
			ID:        user.ID,
			Username:  user.Username,
			Role:      user.Role,
			StudentID: user.StudentID,
			StaffID:   user.StaffID,
		},
	}, nil
}

func (s *authService) GetCurrentUser(userID uint) (*UserSummary, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeUserNotFound, "user not found", err)
	}

	return &UserSummary{
		ID:        user.ID,
		Username:  user.Username,
		Role:      user.Role,
		StudentID: user.StudentID,
		StaffID:   user.StaffID,
	}, nil
}

func (s *authService) CreateUser(user *model.User, password string) error {
	if user.Username == "" || password == "" {
		return pkg.NewAppError(pkg.ErrCodeMissingRequired, "username/password required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return pkg.WrapError(pkg.ErrCodeCreateFailed, "hash password failed", err)
	}

	user.PasswordHash = string(hash)
	user.ID = 0
	if err := s.userRepo.Create(user); err != nil {
		return pkg.WrapError(pkg.ErrCodeCreateFailed, "create user failed", err)
	}
	return nil
}
