package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/middleware"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/service"
)

// enrollReq is the request body for enrollment
type enrollReq struct {
	TermCode   string   `json:"term_code"`
	StudentNo  string   `json:"student_no"`
	StudentNos []string `json:"student_nos"`
	CourseNos  []string `json:"course_nos"`
}

// EnrollmentHandler handles enrollment-related HTTP requests
type EnrollmentHandler struct {
	svc service.EnrollmentService
}

// NewEnrollmentHandler creates a new EnrollmentHandler
func NewEnrollmentHandler(svc service.EnrollmentService) *EnrollmentHandler {
	return &EnrollmentHandler{svc: svc}
}

// Register registers enrollment routes (not used when routes are manually registered in main.go)
func (h *EnrollmentHandler) Register(g *echo.Group) {
	// Routes are now registered manually in main.go for fine-grained RBAC control
}

// List handles GET /enrollments
func (h *EnrollmentHandler) List(c echo.Context) error {
	studentNo := c.QueryParam("student_no")
	courseNo := c.QueryParam("course_no")
	termCode := c.QueryParam("term_code")
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	result, err := h.svc.List(studentNo, courseNo, termCode, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// MyEnrollments handles GET /enrollments/my (for students to view their own enrollments)
func (h *EnrollmentHandler) MyEnrollments(c echo.Context) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeMissingClaims, "missing claims"))
	}

	studentNo := c.QueryParam("student_no")
	result, err := h.svc.ListByStudent(claims.Role, claims.UserID, studentNo)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// Create handles POST /enrollments
func (h *EnrollmentHandler) Create(c echo.Context) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeMissingClaims, "missing claims"))
	}

	var req enrollReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	svcReq := service.EnrollRequest{
		TermCode:   req.TermCode,
		StudentNo:  req.StudentNo,
		StudentNos: req.StudentNos,
		CourseNos:  req.CourseNos,
	}

	results, err := h.svc.Enroll(svcReq, claims.Role, claims.UserID)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(results))
}

// Delete handles DELETE /enrollments/:id
func (h *EnrollmentHandler) Delete(c echo.Context) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, Err(pkg.ErrCodeMissingClaims, "missing claims"))
	}

	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidID, "invalid id"))
	}

	if err := h.svc.Delete(id, claims.Role, claims.UserID); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
}
