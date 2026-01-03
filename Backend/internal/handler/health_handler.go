package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// HealthHandler handles health check HTTP requests
type HealthHandler struct{}

// NewHealthHandler creates a new HealthHandler
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Register registers health check routes
func (h *HealthHandler) Register(e *echo.Echo) {
	e.GET("/health", h.Health)
}

// Health handles GET /health
func (h *HealthHandler) Health(c echo.Context) error {
	return c.JSON(http.StatusOK, OK(map[string]any{"status": "healthy"}))
}
