package service

import (
	"fmt"
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

// SetupRequest represents the initial admin setup request
type SetupRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AuthService defines the interface for authentication business logic
type AuthService interface {
	Login(username, password string) (*LoginResponse, error)
	GetCurrentUser(userID uint) (*UserSummary, error)
	CreateUser(user *model.User, password string) error
	Setup(req SetupRequest) (*UserSummary, error)
	IsSetupRequired() (bool, error)
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

	// Generate JWT using RegisteredClaims for proper parsing
	now := time.Now()
	exp := now.Add(time.Duration(s.cfg.JWTExpiresMinutes) * time.Minute)

	type JWTClaims struct {
		UserID uint   `json:"user_id"`
		Role   string `json:"role"`
		jwt.RegisteredClaims
	}

	claims := JWTClaims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   fmt.Sprintf("%d", user.ID),
		},
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

// IsSetupRequired checks if initial admin setup is required (no users exist)
func (s *authService) IsSetupRequired() (bool, error) {
	count, err := s.userRepo.Count()
	if err != nil {
		return false, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	return count == 0, nil
}

// Setup creates the initial admin account (only works when no users exist)
func (s *authService) Setup(req SetupRequest) (*UserSummary, error) {
	if req.Username == "" || req.Password == "" {
		return nil, pkg.NewAppError(pkg.ErrCodeMissingRequired, "username/password required")
	}

	// Check if setup is still available
	required, err := s.IsSetupRequired()
	if err != nil {
		return nil, err
	}
	if !required {
		return nil, pkg.NewAppError(pkg.ErrCodeForbidden, "setup already completed")
	}

	// Create admin user
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeCreateFailed, "hash password failed", err)
	}

	user := &model.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		Role:         "admin",
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeCreateFailed, "create admin failed", err)
	}

	return &UserSummary{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
	}, nil
}
