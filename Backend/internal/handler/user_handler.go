package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/service"
)

// resetPasswordReq is the request body for password reset
type resetPasswordReq struct {
	Password string `json:"password"`
}

// UserHandler handles user management HTTP requests
type UserHandler struct {
	svc service.UserService
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(svc service.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

// Register registers user management routes
func (h *UserHandler) Register(g *echo.Group) {
	g.GET("/users", h.List)
	g.GET("/users/:id", h.GetByID)
	g.POST("/users", h.Create)
	g.PUT("/users/:id", h.Update)
	g.DELETE("/users/:id", h.Delete)
	g.POST("/users/:id/reset-password", h.ResetPassword)
}

// List handles GET /users
func (h *UserHandler) List(c echo.Context) error {
	result, err := h.svc.List()
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// GetByID handles GET /users/:id
func (h *UserHandler) GetByID(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	result, err := h.svc.GetByID(id)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Create handles POST /users
func (h *UserHandler) Create(c echo.Context) error {
	var req service.CreateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	result, err := h.svc.Create(req)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Update handles PUT /users/:id
func (h *UserHandler) Update(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	var req service.CreateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	result, err := h.svc.Update(id, req)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Delete handles DELETE /users/:id
func (h *UserHandler) Delete(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	if err := h.svc.Delete(id); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
}

// ResetPassword handles POST /users/:id/reset-password
func (h *UserHandler) ResetPassword(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	var req resetPasswordReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	if err := h.svc.ResetPassword(id, req.Password); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"updated": true}))
}
