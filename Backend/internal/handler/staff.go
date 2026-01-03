package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/model"
)

func RegisterStaff(g *echo.Group, gdb *gorm.DB) {
	g.GET("/staff", func(c echo.Context) error {
		staffNo := c.QueryParam("staff_no")
		name := c.QueryParam("name")
		deptNo := c.QueryParam("dept_no")

		type row struct {
			model.Staff
			DeptNo string `json:"dept_no"`
		}

		q := gdb.Table("staff").
			Select("staff.*, departments.dept_no AS dept_no").
			Joins("JOIN departments ON departments.id = staff.dept_id")
		if staffNo != "" {
			q = q.Where("staff.staff_no = ?", staffNo)
		}
		if name != "" {
			q = q.Where("staff.name ILIKE ?", "%"+name+"%")
		}
		if deptNo != "" {
			q = q.Where("departments.dept_no = ?", deptNo)
		}

		var items []row
		if err := q.Order("staff.staff_no asc").Scan(&items).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
		}
		return c.JSON(http.StatusOK, OK(items))
	})

	g.POST("/staff", func(c echo.Context) error {
		var in model.Staff
		if err := c.Bind(&in); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		if in.StaffNo == "" || in.Name == "" || in.DeptID == 0 {
			return c.JSON(http.StatusBadRequest, Err(40002, "staff_no/name/dept_id required"))
		}
		in.ID = 0
		if err := gdb.Create(&in).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40010, "create failed"))
		}
		return c.JSON(http.StatusOK, OK(in))
	})

	g.PUT("/staff/:id", func(c echo.Context) error {
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}
		var in model.Staff
		if err := c.Bind(&in); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		var cur model.Staff
		if err := gdb.First(&cur, id).Error; err != nil {
			return c.JSON(http.StatusNotFound, Err(40401, "not found"))
		}
		// staff_no immutable
		if in.Name != "" {
			cur.Name = in.Name
		}
		cur.Gender = in.Gender
		cur.BirthMonth = in.BirthMonth
		if in.DeptID != 0 {
			cur.DeptID = in.DeptID
		}
		cur.Title = in.Title
		cur.Major = in.Major
		cur.TeachingDirection = in.TeachingDirection

		if err := gdb.Save(&cur).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40011, "update failed"))
		}
		return c.JSON(http.StatusOK, OK(cur))
	})

	g.DELETE("/staff/:id", func(c echo.Context) error {
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}

		// PRD: 删除教师前需校验是否仍承担课程
		var courseCnt int64
		_ = gdb.Model(&model.Course{}).Where("teacher_id = ?", id).Count(&courseCnt).Error
		if courseCnt > 0 {
			return c.JSON(http.StatusBadRequest, Err(40030, "staff still teaches courses"))
		}

		if err := gdb.Delete(&model.Staff{}, id).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40012, "delete failed"))
		}
		return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
	})
}

