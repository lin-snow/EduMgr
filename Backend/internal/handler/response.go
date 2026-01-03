package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/pkg"
)

// Response is the unified API response structure
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// OK returns a success response
func OK(data interface{}) Response {
	return Response{Code: 0, Message: "ok", Data: data}
}

// Err returns an error response
func Err(code int, message string) Response {
	return Response{Code: code, Message: message}
}

// HandleError handles service errors and returns appropriate HTTP response
func HandleError(c echo.Context, err error) error {
	if appErr, ok := err.(*pkg.AppError); ok {
		httpStatus := getHTTPStatus(appErr.Code)
		return c.JSON(httpStatus, Err(appErr.Code, appErr.Message))
	}
	return c.JSON(http.StatusInternalServerError, Err(pkg.ErrCodeDBError, "internal error"))
}

// getHTTPStatus maps error codes to HTTP status codes
func getHTTPStatus(code int) int {
	switch {
	case code >= 40100 && code < 40200:
		return http.StatusUnauthorized
	case code >= 40300 && code < 40400:
		return http.StatusForbidden
	case code >= 40400 && code < 40500:
		return http.StatusNotFound
	case code >= 50000:
		return http.StatusInternalServerError
	default:
		return http.StatusBadRequest
	}
}
