package handler

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/config"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/service"
)

// loginReq is the request body for login
type loginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	svc service.AuthService
	cfg config.Config
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(svc service.AuthService, cfg config.Config) *AuthHandler {
	return &AuthHandler{svc: svc, cfg: cfg}
}

// Register registers auth routes
func (h *AuthHandler) Register(e *echo.Echo) {
	e.POST("/auth/login", h.Login)
	e.GET("/auth/me", h.Me)
	e.GET("/auth/setup", h.CheckSetup)
	e.POST("/auth/setup", h.Setup)
}

// CheckSetup handles GET /auth/setup - checks if initial setup is required
func (h *AuthHandler) CheckSetup(c echo.Context) error {
	required, err := h.svc.IsSetupRequired()
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"setup_required": required}))
}

// Setup handles POST /auth/setup - creates the initial admin account
func (h *AuthHandler) Setup(c echo.Context) error {
	var req service.SetupRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	result, err := h.svc.Setup(req)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Login handles POST /auth/login
func (h *AuthHandler) Login(c echo.Context) error {
	var req loginReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	result, err := h.svc.Login(req.Username, req.Password)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Me handles GET /auth/me
func (h *AuthHandler) Me(c echo.Context) error {
	// Parse JWT from header
	header := c.Request().Header.Get("Authorization")
	if header == "" {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeMissingAuthHeader, "missing Authorization header"))
	}

	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeInvalidAuthHeader, "invalid Authorization header"))
	}

	tokenStr := strings.TrimSpace(parts[1])
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.cfg.JWTSecret), nil
	})
	if err != nil || token == nil || !token.Valid {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeInvalidToken, "invalid token"))
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeInvalidClaims, "invalid claims"))
	}

	userIDAny := claims["user_id"]
	userIDFloat, ok := userIDAny.(float64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeInvalidClaims, "invalid claims"))
	}

	userID := uint(userIDFloat)
	result, err := h.svc.GetCurrentUser(userID)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}
