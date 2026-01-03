package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/service"
)

// CourseHandler handles course-related HTTP requests
type CourseHandler struct {
	svc service.CourseService
}

// NewCourseHandler creates a new CourseHandler
func NewCourseHandler(svc service.CourseService) *CourseHandler {
	return &CourseHandler{svc: svc}
}

// Register registers course routes
func (h *CourseHandler) Register(g *echo.Group) {
	g.GET("/courses", h.List)
	g.POST("/courses", h.Create)
	g.PUT("/courses/:id", h.Update)
	g.DELETE("/courses/:id", h.Delete)
}

// List handles GET /courses
func (h *CourseHandler) List(c echo.Context) error {
	courseNo := c.QueryParam("course_no")
	name := c.QueryParam("name")
	teacherName := c.QueryParam("teacher_name")
	pageStr := c.QueryParam("page")
	pageSizeStr := c.QueryParam("page_size")

	// If pagination params provided, use paginated query
	if pageStr != "" || pageSizeStr != "" {
		page, _ := strconv.Atoi(pageStr)
		pageSize, _ := strconv.Atoi(pageSizeStr)
		result, err := h.svc.ListPaginated(courseNo, name, teacherName, page, pageSize)
		if err != nil {
			return HandleError(c, err)
		}
		return c.JSON(http.StatusOK, OK(result))
	}

	// Otherwise return all results
	items, err := h.svc.List(courseNo, name, teacherName)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(items))
}

// Create handles POST /courses
func (h *CourseHandler) Create(c echo.Context) error {
	var in model.Course
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	if err := h.svc.Create(&in); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(in))
}

// Update handles PUT /courses/:id
func (h *CourseHandler) Update(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	var in model.Course
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	result, err := h.svc.Update(id, &in)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Delete handles DELETE /courses/:id
func (h *CourseHandler) Delete(c echo.Context) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	if err := h.svc.Delete(id); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
}
