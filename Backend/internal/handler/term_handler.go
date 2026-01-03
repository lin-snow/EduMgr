package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/service"
)

// TermHandler handles term-related HTTP requests
type TermHandler struct {
	svc service.TermService
}

// NewTermHandler creates a new TermHandler
func NewTermHandler(svc service.TermService) *TermHandler {
	return &TermHandler{svc: svc}
}

// Register registers term routes
func (h *TermHandler) Register(g *echo.Group) {
	g.GET("/terms", h.List)
	g.POST("/terms", h.Create)
}

// List handles GET /terms
func (h *TermHandler) List(c echo.Context) error {
	items, err := h.svc.List()
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(items))
}

// Create handles POST /terms
func (h *TermHandler) Create(c echo.Context) error {
	var in model.Term
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, Err(pkg.ErrCodeInvalidJSON, "invalid json"))
	}

	if err := h.svc.Create(&in); err != nil {
		return HandleError(c, err)
	}
	return c.JSON(http.StatusOK, OK(in))
}
