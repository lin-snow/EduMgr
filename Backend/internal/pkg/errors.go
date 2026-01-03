package pkg

import "fmt"

// AppError represents an application-level error with code and message
type AppError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Err     error  `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// NewAppError creates a new AppError
func NewAppError(code int, message string) *AppError {
	return &AppError{Code: code, Message: message}
}

// WrapError wraps an error with an AppError
func WrapError(code int, message string, err error) *AppError {
	return &AppError{Code: code, Message: message, Err: err}
}

// Common error codes
const (
	// 400xx - Bad Request errors
	ErrCodeInvalidJSON      = 40001
	ErrCodeMissingRequired  = 40002
	ErrCodeInvalidID        = 40003
	ErrCodeCreateFailed     = 40010
	ErrCodeUpdateFailed     = 40011
	ErrCodeDeleteFailed     = 40012
	ErrCodeDeptHasStudents  = 40020
	ErrCodeDeptHasStaff     = 40021
	ErrCodeStaffHasCourses  = 40030
	ErrCodeCourseHasEnroll  = 40040
	ErrCodeCourseHasGrades  = 40041
	ErrCodeArchiveFailed    = 40050
	ErrCodeTermNotFound     = 40060
	ErrCodeCourseNotFound   = 40061
	ErrCodeStudentNotFound  = 40062
	ErrCodeDuplicateEnroll  = 40063
	ErrCodeCreditExceeded   = 40064
	ErrCodeEnrollFailed     = 40065
	ErrCodeEnrollDelFailed  = 40066
	ErrCodeGradeCourseNF    = 40070
	ErrCodeGradeStudentNF   = 40071
	ErrCodeGradeUpsertFail  = 40072

	// 401xx - Authentication errors
	ErrCodeMissingAuthHeader   = 40101
	ErrCodeInvalidAuthHeader   = 40102
	ErrCodeEmptyToken          = 40103
	ErrCodeInvalidToken        = 40104
	ErrCodeInvalidClaims       = 40105
	ErrCodeMissingClaims       = 40106
	ErrCodeInvalidCredentials  = 40110
	ErrCodeUserNotFound        = 40111

	// 403xx - Forbidden errors
	ErrCodeForbidden       = 40301
	ErrCodeStudentNotBound = 40302

	// 404xx - Not Found errors
	ErrCodeNotFound = 40401

	// 500xx - Internal errors
	ErrCodeDBError     = 50010
	ErrCodeSignToken   = 50001
)

// Predefined errors
var (
	ErrInvalidJSON      = NewAppError(ErrCodeInvalidJSON, "invalid json")
	ErrMissingRequired  = NewAppError(ErrCodeMissingRequired, "missing required fields")
	ErrInvalidID        = NewAppError(ErrCodeInvalidID, "invalid id")
	ErrNotFound         = NewAppError(ErrCodeNotFound, "not found")
	ErrForbidden        = NewAppError(ErrCodeForbidden, "forbidden")
	ErrDBError          = NewAppError(ErrCodeDBError, "database error")
)
