package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/model"
)

func RegisterStudents(g *echo.Group, gdb *gorm.DB) {
	g.GET("/students", func(c echo.Context) error {
		studentNo := c.QueryParam("student_no")
		name := c.QueryParam("name")
		deptNo := c.QueryParam("dept_no")

		type row struct {
			model.Student
			DeptNo string `json:"dept_no"`
		}

		q := gdb.Table("students").
			Select("students.*, departments.dept_no AS dept_no").
			Joins("JOIN departments ON departments.id = students.dept_id")
		if studentNo != "" {
			q = q.Where("students.student_no = ?", studentNo)
		}
		if name != "" {
			q = q.Where("students.name ILIKE ?", "%"+name+"%")
		}
		if deptNo != "" {
			q = q.Where("departments.dept_no = ?", deptNo)
		}

		var items []row
		if err := q.Order("students.student_no asc").Scan(&items).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
		}
		return c.JSON(http.StatusOK, OK(items))
	})

	g.POST("/students", func(c echo.Context) error {
		var in model.Student
		if err := c.Bind(&in); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		if in.StudentNo == "" || in.Name == "" || in.DeptID == 0 {
			return c.JSON(http.StatusBadRequest, Err(40002, "student_no/name/dept_id required"))
		}
		in.ID = 0
		if err := gdb.Create(&in).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40010, "create failed"))
		}
		return c.JSON(http.StatusOK, OK(in))
	})

	g.PUT("/students/:id", func(c echo.Context) error {
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}
		var in model.Student
		if err := c.Bind(&in); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		var cur model.Student
		if err := gdb.First(&cur, id).Error; err != nil {
			return c.JSON(http.StatusNotFound, Err(40401, "not found"))
		}
		// student_no immutable (PRD: 学号唯一且不允许修改)
		if in.Name != "" {
			cur.Name = in.Name
		}
		cur.Gender = in.Gender
		cur.BirthDate = in.BirthDate
		cur.EntryScore = in.EntryScore
		if in.DeptID != 0 {
			cur.DeptID = in.DeptID
		}
		if in.Status != "" {
			cur.Status = in.Status
		}

		if err := gdb.Save(&cur).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40011, "update failed"))
		}
		return c.JSON(http.StatusOK, OK(cur))
	})

	g.DELETE("/students/:id", func(c echo.Context) error {
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}
		if err := gdb.Delete(&model.Student{}, id).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40012, "delete failed"))
		}
		return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
	})
}

