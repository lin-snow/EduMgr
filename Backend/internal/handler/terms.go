package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/model"
)

func RegisterTerms(g *echo.Group, gdb *gorm.DB) {
	g.GET("/terms", func(c echo.Context) error {
		var items []model.Term
		if err := gdb.Order("term_code desc").Find(&items).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
		}
		return c.JSON(http.StatusOK, OK(items))
	})

	g.POST("/terms", func(c echo.Context) error {
		var in model.Term
		if err := c.Bind(&in); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		if in.TermCode == "" || in.Name == "" {
			return c.JSON(http.StatusBadRequest, Err(40002, "term_code/name required"))
		}
		in.ID = 0
		if err := gdb.Create(&in).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40010, "create failed"))
		}
		return c.JSON(http.StatusOK, OK(in))
	})
}

