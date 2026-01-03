package server

import (
	"github.com/lin-snow/edumgr/internal/handler"
	"github.com/lin-snow/edumgr/internal/service"
)

// Handlers holds all HTTP handlers
type Handlers struct {
	Health     *handler.HealthHandler
	Auth       *handler.AuthHandler
	Department *handler.DepartmentHandler
	Student    *handler.StudentHandler
	Staff      *handler.StaffHandler
	Course     *handler.CourseHandler
	Term       *handler.TermHandler
	Enrollment *handler.EnrollmentHandler
	Grade      *handler.GradeHandler
	Report     *handler.ReportHandler
	User       *handler.UserHandler
}

// NewHandlers creates a new Handlers instance
func NewHandlers(
	health *handler.HealthHandler,
	auth *handler.AuthHandler,
	department *handler.DepartmentHandler,
	student *handler.StudentHandler,
	staff *handler.StaffHandler,
	course *handler.CourseHandler,
	term *handler.TermHandler,
	enrollment *handler.EnrollmentHandler,
	grade *handler.GradeHandler,
	report *handler.ReportHandler,
	user *handler.UserHandler,
) *Handlers {
	return &Handlers{
		Health:     health,
		Auth:       auth,
		Department: department,
		Student:    student,
		Staff:      staff,
		Course:     course,
		Term:       term,
		Enrollment: enrollment,
		Grade:      grade,
		Report:     report,
		User:       user,
	}
}

// Services holds all business services
type Services struct {
	Department service.DepartmentService
	Student    service.StudentService
	Staff      service.StaffService
	Course     service.CourseService
	Term       service.TermService
	Enrollment service.EnrollmentService
	Grade      service.GradeService
	Auth       service.AuthService
	Report     service.ReportService
	User       service.UserService
}

// NewServices creates a new Services instance
func NewServices(
	department service.DepartmentService,
	student service.StudentService,
	staff service.StaffService,
	course service.CourseService,
	term service.TermService,
	enrollment service.EnrollmentService,
	grade service.GradeService,
	auth service.AuthService,
	report service.ReportService,
	user service.UserService,
) *Services {
	return &Services{
		Department: department,
		Student:    student,
		Staff:      staff,
		Course:     course,
		Term:       term,
		Enrollment: enrollment,
		Grade:      grade,
		Auth:       auth,
		Report:     report,
		User:       user,
	}
}
