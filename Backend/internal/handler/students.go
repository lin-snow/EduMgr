package handler

import (
	"net/http"
	"time"

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

	// PRD 3.1.3: 学籍异动（毕业/转出/转入）
	// 说明：为避免破坏 enrollments/grades 外键，本实现采用“标记状态 + 写入历史表”的方式。
	g.POST("/students/:id/graduate", func(c echo.Context) error {
		return archiveStudent(c, gdb, "graduated", "graduate")
	})
	g.POST("/students/:id/transfer-out", func(c echo.Context) error {
		return archiveStudent(c, gdb, "transfer_out", "transfer_out")
	})
	g.POST("/students/:id/transfer-in", func(c echo.Context) error {
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}
		var stu model.Student
		if err := gdb.First(&stu, id).Error; err != nil {
			return c.JSON(http.StatusNotFound, Err(40401, "not found"))
		}
		stu.Status = "transfer_in"
		if err := gdb.Save(&stu).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40011, "update failed"))
		}
		return c.JSON(http.StatusOK, OK(stu))
	})
}

func archiveStudent(c echo.Context, gdb *gorm.DB, newStatus string, reason string) error {
	id, err := pathUint(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
	}
	var stu model.Student
	if err := gdb.First(&stu, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Err(40401, "not found"))
	}

	now := time.Now()
	h := model.StudentHistory{
		StudentNo:     stu.StudentNo,
		Name:          stu.Name,
		Gender:        stu.Gender,
		BirthDate:     stu.BirthDate,
		EntryScore:    stu.EntryScore,
		DeptID:        stu.DeptID,
		Status:        newStatus,
		ArchivedAt:    now,
		ArchiveReason: reason,
	}

	if err := gdb.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&h).Error; err != nil {
			return err
		}
		stu.Status = newStatus
		if err := tx.Save(&stu).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return c.JSON(http.StatusBadRequest, Err(40050, "archive failed"))
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"archived": true}))
}

