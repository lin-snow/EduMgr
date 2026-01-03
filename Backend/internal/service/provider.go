package service

import "github.com/google/wire"

// ProviderSet is the wire provider set for service layer
var ProviderSet = wire.NewSet(
	NewDepartmentService,
	NewStudentService,
	NewStaffService,
	NewCourseService,
	NewTermService,
	NewEnrollmentService,
	NewGradeService,
	NewAuthService,
	NewReportService,
	NewUserService,
)
