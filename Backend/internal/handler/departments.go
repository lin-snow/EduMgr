package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/model"
)

func RegisterDepartments(g *echo.Group, gdb *gorm.DB) {
	g.GET("/departments", func(c echo.Context) error {
		deptNo := c.QueryParam("dept_no")
		name := c.QueryParam("name")

		q := gdb.Model(&model.Department{})
		if deptNo != "" {
			q = q.Where("dept_no = ?", deptNo)
		}
		if name != "" {
			q = q.Where("name ILIKE ?", "%"+name+"%")
		}

		var items []model.Department
		if err := q.Order("dept_no asc").Find(&items).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
		}
		return c.JSON(http.StatusOK, OK(items))
	})

	g.POST("/departments", func(c echo.Context) error {
		var in model.Department
		if err := c.Bind(&in); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		if in.DeptNo == "" || in.Name == "" {
			return c.JSON(http.StatusBadRequest, Err(40002, "dept_no/name required"))
		}
		in.ID = 0
		if err := gdb.Create(&in).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40010, "create failed"))
		}
		return c.JSON(http.StatusOK, OK(in))
	})

	g.PUT("/departments/:id", func(c echo.Context) error {
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}
		var in model.Department
		if err := c.Bind(&in); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		var cur model.Department
		if err := gdb.First(&cur, id).Error; err != nil {
			return c.JSON(http.StatusNotFound, Err(40401, "not found"))
		}

		// Keep dept_no immutable to avoid breaking FKs and query semantics.
		if in.Name != "" {
			cur.Name = in.Name
		}
		cur.Intro = in.Intro

		if err := gdb.Save(&cur).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40011, "update failed"))
		}
		return c.JSON(http.StatusOK, OK(cur))
	})

	g.DELETE("/departments/:id", func(c echo.Context) error {
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}

		// PRD: 删除系前需校验是否存在关联学生、教师或课程
		var stuCnt int64
		_ = gdb.Model(&model.Student{}).Where("dept_id = ?", id).Count(&stuCnt).Error
		if stuCnt > 0 {
			return c.JSON(http.StatusBadRequest, Err(40020, "department has students"))
		}
		var staffCnt int64
		_ = gdb.Model(&model.Staff{}).Where("dept_id = ?", id).Count(&staffCnt).Error
		if staffCnt > 0 {
			return c.JSON(http.StatusBadRequest, Err(40021, "department has staff"))
		}
		// Courses link to staff; dept -> courses is indirect, but still blocks deletion via staff above.

		if err := gdb.Delete(&model.Department{}, id).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40012, "delete failed"))
		}
		return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
	})
}

