package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/service"
)

// DepartmentHandler handles department-related HTTP requests
type DepartmentHandler struct {
	svc service.DepartmentService
}

// NewDepartmentHandler creates a new DepartmentHandler
func NewDepartmentHandler(svc service.DepartmentService) *DepartmentHandler {
	return &DepartmentHandler{svc: svc}
}

// Register registers department routes
func (h *DepartmentHandler) Register(g *echo.Group) {
	g.GET("/departments", h.List)
	g.POST("/departments", h.Create)
	g.PUT("/departments/:id", h.Update)
	g.DELETE("/departments/:id", h.Delete)
}

// List handles GET /departments
func (h *DepartmentHandler) List(c echo.Context) error {
	deptNo := c.QueryParam("dept_no")
	name := c.QueryParam("name")

	items, err := h.svc.List(deptNo, name)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(items))
}

// Create handles POST /departments
func (h *DepartmentHandler) Create(c echo.Context) error {
	var in model.Department
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	if err := h.svc.Create(&in); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(in))
}

// Update handles PUT /departments/:id
func (h *DepartmentHandler) Update(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	var in model.Department
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	result, err := h.svc.Update(id, &in)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Delete handles DELETE /departments/:id
func (h *DepartmentHandler) Delete(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	if err := h.svc.Delete(id); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
}
