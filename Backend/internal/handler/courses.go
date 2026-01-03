package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/model"
)

func RegisterCourses(g *echo.Group, gdb *gorm.DB) {
	g.GET("/courses", func(c echo.Context) error {
		courseNo := c.QueryParam("course_no")
		name := c.QueryParam("name")
		teacherName := c.QueryParam("teacher_name")

		type row struct {
			model.Course
			TeacherName string `json:"teacher_name"`
			TeacherNo   string `json:"teacher_no"`
		}

		q := gdb.Table("courses").
			Select("courses.*, staff.name AS teacher_name, staff.staff_no AS teacher_no").
			Joins("JOIN staff ON staff.id = courses.teacher_id")
		if courseNo != "" {
			q = q.Where("courses.course_no = ?", courseNo)
		}
		if name != "" {
			q = q.Where("courses.name ILIKE ?", "%"+name+"%")
		}
		if teacherName != "" {
			q = q.Where("staff.name ILIKE ?", "%"+teacherName+"%")
		}

		var items []row
		if err := q.Order("courses.course_no asc").Scan(&items).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
		}
		return c.JSON(http.StatusOK, OK(items))
	})

	g.POST("/courses", func(c echo.Context) error {
		var in model.Course
		if err := c.Bind(&in); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		if in.CourseNo == "" || in.Name == "" || in.TeacherID == 0 {
			return c.JSON(http.StatusBadRequest, Err(40002, "course_no/name/teacher_id required"))
		}
		in.ID = 0
		if err := gdb.Create(&in).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40010, "create failed"))
		}
		return c.JSON(http.StatusOK, OK(in))
	})

	g.PUT("/courses/:id", func(c echo.Context) error {
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}
		var in model.Course
		if err := c.Bind(&in); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		var cur model.Course
		if err := gdb.First(&cur, id).Error; err != nil {
			return c.JSON(http.StatusNotFound, Err(40401, "not found"))
		}
		// course_no immutable
		if in.Name != "" {
			cur.Name = in.Name
		}
		if in.TeacherID != 0 {
			cur.TeacherID = in.TeacherID
		}
		cur.Hours = in.Hours
		cur.Credits = in.Credits
		cur.ClassTime = in.ClassTime
		cur.ClassLocation = in.ClassLocation
		cur.ExamTime = in.ExamTime

		// PRD: 修改课程信息需保证已有选课与成绩数据一致性。
		// 这里通过“课程主键不变 + 课程号不可变”确保查询口径稳定；涉及任课教师变更也保留课程号不变。
		if err := gdb.Save(&cur).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40011, "update failed"))
		}
		return c.JSON(http.StatusOK, OK(cur))
	})

	g.DELETE("/courses/:id", func(c echo.Context) error {
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}
		// 避免破坏选课/成绩一致性：如果存在 enrollments/grades，则拒绝删除（可后续扩展为软删除）
		var enrCnt int64
		_ = gdb.Table("enrollments").Where("course_id = ?", id).Count(&enrCnt).Error
		if enrCnt > 0 {
			return c.JSON(http.StatusBadRequest, Err(40040, "course has enrollments"))
		}
		var grdCnt int64
		_ = gdb.Table("grades").Where("course_id = ?", id).Count(&grdCnt).Error
		if grdCnt > 0 {
			return c.JSON(http.StatusBadRequest, Err(40041, "course has grades"))
		}
		if err := gdb.Delete(&model.Course{}, id).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40012, "delete failed"))
		}
		return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
	})
}

