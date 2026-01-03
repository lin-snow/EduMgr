package handler

import "github.com/google/wire"

// ProviderSet is the wire provider set for handler layer
var ProviderSet = wire.NewSet(
	NewHealthHandler,
	NewAuthHandler,
	NewDepartmentHandler,
	NewStudentHandler,
	NewStaffHandler,
	NewCourseHandler,
	NewTermHandler,
	NewEnrollmentHandler,
	NewGradeHandler,
	NewReportHandler,
	NewUserHandler,
)
