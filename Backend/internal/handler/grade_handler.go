package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/middleware"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/service"
)

// putGradesByCourseReq is the request body for grades by course
type putGradesByCourseReq struct {
	CourseNo string              `json:"course_no"`
	Items    []service.GradeItem `json:"items"`
}

// putGradesByStudentReq is the request body for grades by student
type putGradesByStudentReq struct {
	StudentNo string              `json:"student_no"`
	Items     []service.GradeItem `json:"items"`
}

// GradeHandler handles grade-related HTTP requests
type GradeHandler struct {
	svc service.GradeService
}

// NewGradeHandler creates a new GradeHandler
func NewGradeHandler(svc service.GradeService) *GradeHandler {
	return &GradeHandler{svc: svc}
}

// Register registers grade routes (not used when routes are manually registered in main.go)
func (h *GradeHandler) Register(g *echo.Group) {
	// Routes are now registered manually in main.go for fine-grained RBAC control
}

// MyGrades handles GET /grades/my (for students to view their own grades)
func (h *GradeHandler) MyGrades(c echo.Context) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeMissingClaims, "missing claims"))
	}

	result, err := h.svc.QueryMyGrades(claims.UserID)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Query handles GET /grades
func (h *GradeHandler) Query(c echo.Context) error {
	params := service.GradeQueryParams{
		StudentNo:   c.QueryParam("student_no"),
		StudentName: c.QueryParam("student_name"),
		CourseNo:    c.QueryParam("course_no"),
		CourseName:  c.QueryParam("course_name"),
		TeacherName: c.QueryParam("teacher_name"),
		DeptNo:      c.QueryParam("dept_no"),
	}

	result, err := h.svc.Query(params)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// UpsertByCourse handles PUT /grades/by-course
func (h *GradeHandler) UpsertByCourse(c echo.Context) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeMissingClaims, "missing claims"))
	}
	if claims.Role != "admin" && claims.Role != "teacher" {
		return c.JSON(http.StatusForbidden, Err(pkg.ErrCodeForbidden, "forbidden"))
	}

	var req putGradesByCourseReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	if err := h.svc.UpsertByCourse(req.CourseNo, req.Items, claims.Role, claims.UserID); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"updated": true}))
}

// UpsertByStudent handles PUT /grades/by-student
func (h *GradeHandler) UpsertByStudent(c echo.Context) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeMissingClaims, "missing claims"))
	}
	if claims.Role != "admin" && claims.Role != "teacher" {
		return c.JSON(http.StatusForbidden, Err(pkg.ErrCodeForbidden, "forbidden"))
	}

	var req putGradesByStudentReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	if err := h.svc.UpsertByStudent(req.StudentNo, req.Items, claims.Role, claims.UserID); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"updated": true}))
}
