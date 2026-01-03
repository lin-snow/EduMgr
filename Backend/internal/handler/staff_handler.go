package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/service"
)

// StaffHandler handles staff-related HTTP requests
type StaffHandler struct {
	svc service.StaffService
}

// NewStaffHandler creates a new StaffHandler
func NewStaffHandler(svc service.StaffService) *StaffHandler {
	return &StaffHandler{svc: svc}
}

// Register registers staff routes
func (h *StaffHandler) Register(g *echo.Group) {
	g.GET("/staff", h.List)
	g.POST("/staff", h.Create)
	g.PUT("/staff/:id", h.Update)
	g.DELETE("/staff/:id", h.Delete)
}

// List handles GET /staff
func (h *StaffHandler) List(c echo.Context) error {
	staffNo := c.QueryParam("staff_no")
	name := c.QueryParam("name")
	deptNo := c.QueryParam("dept_no")
	pageStr := c.QueryParam("page")
	pageSizeStr := c.QueryParam("page_size")

	// If pagination params provided, use paginated query
	if pageStr != "" || pageSizeStr != "" {
		page, _ := strconv.Atoi(pageStr)
		pageSize, _ := strconv.Atoi(pageSizeStr)
		result, err := h.svc.ListPaginated(staffNo, name, deptNo, page, pageSize)
		if err != nil {
			return HandleError(c, err)
		}
		return c.JSON(http.StatusOK, OK(result))
	}

	// Otherwise return all results
	items, err := h.svc.List(staffNo, name, deptNo)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(items))
}

// Create handles POST /staff
func (h *StaffHandler) Create(c echo.Context) error {
	var in model.Staff
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	if err := h.svc.Create(&in); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(in))
}

// Update handles PUT /staff/:id
func (h *StaffHandler) Update(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	var in model.Staff
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	result, err := h.svc.Update(id, &in)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Delete handles DELETE /staff/:id
func (h *StaffHandler) Delete(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	if err := h.svc.Delete(id); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
}
