package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/config"
	"github.com/lin-snow/edumgr/internal/model"
)

type loginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type loginResp struct {
	Token string      `json:"token"`
	User  userSummary `json:"user"`
}

type userSummary struct {
	ID        uint  `json:"id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	StudentID *uint  `json:"student_id,omitempty"`
	StaffID   *uint  `json:"staff_id,omitempty"`
}

func RegisterAuth(e *echo.Echo, gdb *gorm.DB, cfg config.Config) {
	e.POST("/auth/login", func(c echo.Context) error {
		var req loginReq
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		if req.Username == "" || req.Password == "" {
			return c.JSON(http.StatusBadRequest, Err(40002, "username/password required"))
		}

		var u model.User
		if err := gdb.Where("username = ?", req.Username).First(&u).Error; err != nil {
			return c.JSON(http.StatusUnauthorized, Err(40110, "invalid username or password"))
		}
		if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
			return c.JSON(http.StatusUnauthorized, Err(40110, "invalid username or password"))
		}

		now := time.Now()
		exp := now.Add(time.Duration(cfg.JWTExpiresMinutes) * time.Minute)

		claims := jwt.MapClaims{
			"sub":     u.ID,
			"user_id": u.ID,
			"role":    u.Role,
			"exp":     exp.Unix(),
			"iat":     now.Unix(),
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signed, err := token.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50001, "sign token failed"))
		}

		resp := loginResp{
			Token: signed,
			User: userSummary{
				ID:        u.ID,
				Username:  u.Username,
				Role:      u.Role,
				StudentID: u.StudentID,
				StaffID:   u.StaffID,
			},
		}
		return c.JSON(http.StatusOK, OK(resp))
	})

	e.GET("/auth/me", func(c echo.Context) error {
		// Note: this endpoint is also used by frontend to refresh user context.
		// It expects JWT middleware upstream in real usage; for now we allow it to
		// be mounted publicly and return 401 if no/invalid token is present.
		h := c.Request().Header.Get("Authorization")
		if h == "" {
			return c.JSON(http.StatusUnauthorized, Err(40101, "missing Authorization header"))
		}
		// Reuse the same parsing logic by verifying token quickly here.
		parts := strings.SplitN(h, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return c.JSON(http.StatusUnauthorized, Err(40102, "invalid Authorization header"))
		}
		tokenStr := strings.TrimSpace(parts[1])
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})
		if err != nil || token == nil || !token.Valid {
			return c.JSON(http.StatusUnauthorized, Err(40104, "invalid token"))
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.JSON(http.StatusUnauthorized, Err(40105, "invalid claims"))
		}
		userIDAny := claims["user_id"]
		userIDFloat, ok := userIDAny.(float64)
		if !ok {
			return c.JSON(http.StatusUnauthorized, Err(40105, "invalid claims"))
		}
		userID := uint(userIDFloat)
		var u model.User
		if err := gdb.First(&u, userID).Error; err != nil {
			return c.JSON(http.StatusUnauthorized, Err(40111, "user not found"))
		}
		return c.JSON(http.StatusOK, OK(userSummary{
			ID:        u.ID,
			Username:  u.Username,
			Role:      u.Role,
			StudentID: u.StudentID,
			StaffID:   u.StaffID,
		}))
	})
}

