package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/service"
)

// ReportHandler handles report-related HTTP requests
type ReportHandler struct {
	svc service.ReportService
}

// NewReportHandler creates a new ReportHandler
func NewReportHandler(svc service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

// Register registers report routes
func (h *ReportHandler) Register(g *echo.Group) {
	g.GET("/reports/grade-roster", h.GradeRoster)
	g.GET("/reports/grade-report", h.GradeReport)
}

// GradeRoster handles GET /reports/grade-roster
func (h *ReportHandler) GradeRoster(c echo.Context) error {
	params := service.ReportQueryParams{
		CourseNo:    c.QueryParam("course_no"),
		CourseName:  c.QueryParam("course_name"),
		TeacherName: c.QueryParam("teacher_name"),
		DeptNo:      c.QueryParam("dept_no"),
	}

	result, err := h.svc.GetGradeRoster(params)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}

// GradeReport handles GET /reports/grade-report
func (h *ReportHandler) GradeReport(c echo.Context) error {
	params := service.ReportQueryParams{
		CourseNo:    c.QueryParam("course_no"),
		CourseName:  c.QueryParam("course_name"),
		TeacherName: c.QueryParam("teacher_name"),
		DeptNo:      c.QueryParam("dept_no"),
	}

	result, err := h.svc.GetGradeReport(params)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(result))
}
