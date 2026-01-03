package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/middleware"
	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/service"
)

// StudentHandler handles student-related HTTP requests
type StudentHandler struct {
	svc service.StudentService
}

// NewStudentHandler creates a new StudentHandler
func NewStudentHandler(svc service.StudentService) *StudentHandler {
	return &StudentHandler{svc: svc}
}

// Register registers student routes
func (h *StudentHandler) Register(g *echo.Group) {
	g.GET("/students", h.List)
	g.POST("/students", h.Create)
	g.PUT("/students/:id", h.Update)
	g.DELETE("/students/:id", h.Delete)
	g.POST("/students/:id/graduate", h.Graduate)
	g.POST("/students/:id/transfer-out", h.TransferOut)
	g.POST("/students/:id/transfer-in", h.TransferIn)
}

// List handles GET /students
func (h *StudentHandler) List(c echo.Context) error {
	studentNo := c.QueryParam("student_no")
	name := c.QueryParam("name")
	deptNo := c.QueryParam("dept_no")
	pageStr := c.QueryParam("page")
	pageSizeStr := c.QueryParam("page_size")

	// If pagination params provided, use paginated query
	if pageStr != "" || pageSizeStr != "" {
		page, _ := strconv.Atoi(pageStr)
		pageSize, _ := strconv.Atoi(pageSizeStr)
		result, err := h.svc.ListPaginated(studentNo, name, deptNo, page, pageSize)
		if err != nil {
			return HandleError(c, err)
		}
		return c.JSON(http.StatusOK, OK(result))
	}

	// Otherwise return all results
	items, err := h.svc.List(studentNo, name, deptNo)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(items))
}

// Create handles POST /students
func (h *StudentHandler) Create(c echo.Context) error {
	var in model.Student
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	if err := h.svc.Create(&in); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(in))
}

// Update handles PUT /students/:id
func (h *StudentHandler) Update(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	var in model.Student
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	result, err := h.svc.Update(id, &in)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Delete handles DELETE /students/:id
func (h *StudentHandler) Delete(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	if err := h.svc.Delete(id); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
}

// Graduate handles POST /students/:id/graduate
func (h *StudentHandler) Graduate(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	if err := h.svc.Graduate(id); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"archived": true}))
}

// TransferOut handles POST /students/:id/transfer-out
func (h *StudentHandler) TransferOut(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	if err := h.svc.TransferOut(id); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"archived": true}))
}

// TransferIn handles POST /students/:id/transfer-in
func (h *StudentHandler) TransferIn(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	result, err := h.svc.TransferIn(id)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// MyInfo handles GET /students/my (for students to view their own info)
func (h *StudentHandler) MyInfo(c echo.Context) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeMissingClaims, "missing claims"))
	}

	result, err := h.svc.GetMyInfo(claims.UserID)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}
