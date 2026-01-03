package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func RegisterHealth(e *echo.Echo) {
	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, OK(map[string]any{"status": "ok"}))
	})
}

