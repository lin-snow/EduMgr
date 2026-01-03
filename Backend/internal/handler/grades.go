package handler

import (
	"net/http"
	"sort"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/middleware"
	"github.com/lin-snow/edumgr/internal/model"
)

type gradeItem struct {
	StudentNo  string   `json:"student_no"`
	CourseNo   string   `json:"course_no"`
	UsualScore *float64 `json:"usual_score"`
	ExamScore  *float64 `json:"exam_score"`
	FinalScore *float64 `json:"final_score"`
}

type putGradesByCourseReq struct {
	CourseNo string      `json:"course_no"`
	Items    []gradeItem `json:"items"`
}

type putGradesByStudentReq struct {
	StudentNo string      `json:"student_no"`
	Items     []gradeItem `json:"items"`
}

func RegisterGrades(g *echo.Group, gdb *gorm.DB) {
	// PRD 4.5: 按条件查询，返回课程信息+成绩；多门课程按课程分组；组内按总评降序
	g.GET("/grades", func(c echo.Context) error {
		studentNo := c.QueryParam("student_no")
		studentName := c.QueryParam("student_name")
		courseNo := c.QueryParam("course_no")
		courseName := c.QueryParam("course_name")
		teacherName := c.QueryParam("teacher_name")
		deptNo := c.QueryParam("dept_no")

		type row struct {
			StudentID   uint    `json:"student_id"`
			StudentNo   string  `json:"student_no"`
			StudentName string  `json:"student_name"`
			Gender      string  `json:"gender"`
			CourseID    uint    `json:"course_id"`
			CourseNo    string  `json:"course_no"`
			CourseName  string  `json:"course_name"`
			TeacherID   uint    `json:"teacher_id"`
			TeacherNo   string  `json:"teacher_no"`
			TeacherName string  `json:"teacher_name"`
			DeptNo      string  `json:"dept_no"`
			Hours       int     `json:"hours"`
			Credits     int     `json:"credits"`
			ClassTime   string  `json:"class_time"`
			ClassLoc    string  `json:"class_location"`
			ExamTime    string  `json:"exam_time"`
			UsualScore  *float64 `json:"usual_score"`
			ExamScore   *float64 `json:"exam_score"`
			FinalScore  *float64 `json:"final_score"`
		}

		q := gdb.Table("grades").
			Select(`
				students.id AS student_id, students.student_no, students.name AS student_name, students.gender,
				courses.id AS course_id, courses.course_no, courses.name AS course_name,
				staff.id AS teacher_id, staff.staff_no AS teacher_no, staff.name AS teacher_name,
				departments.dept_no,
				courses.hours, courses.credits, courses.class_time, courses.class_location, courses.exam_time,
				grades.usual_score, grades.exam_score, grades.final_score
			`).
			Joins("JOIN students ON students.id = grades.student_id").
			Joins("JOIN courses ON courses.id = grades.course_id").
			Joins("JOIN staff ON staff.id = courses.teacher_id").
			Joins("JOIN departments ON departments.id = students.dept_id")

		if studentNo != "" {
			q = q.Where("students.student_no = ?", studentNo)
		}
		if studentName != "" {
			q = q.Where("students.name ILIKE ?", "%"+studentName+"%")
		}
		if courseNo != "" {
			q = q.Where("courses.course_no = ?", courseNo)
		}
		if courseName != "" {
			q = q.Where("courses.name ILIKE ?", "%"+courseName+"%")
		}
		if teacherName != "" {
			q = q.Where("staff.name ILIKE ?", "%"+teacherName+"%")
		}
		if deptNo != "" {
			q = q.Where("departments.dept_no = ?", deptNo)
		}

		var rows []row
		// order first by course_no then final_score desc so frontend can render quickly; still we will group in response.
		if err := q.Order("courses.course_no asc, grades.final_score desc NULLS LAST, students.student_no asc").
			Scan(&rows).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
		}

		type gradeRow struct {
			StudentNo   string   `json:"student_no"`
			StudentName string   `json:"student_name"`
			Gender      string   `json:"gender"`
			UsualScore  *float64 `json:"usual_score"`
			ExamScore   *float64 `json:"exam_score"`
			FinalScore  *float64 `json:"final_score"`
		}
		type courseGroup struct {
			CourseNo    string     `json:"course_no"`
			CourseName  string     `json:"course_name"`
			TeacherNo   string     `json:"teacher_no"`
			TeacherName string     `json:"teacher_name"`
			Hours       int        `json:"hours"`
			Credits     int        `json:"credits"`
			ClassTime   string     `json:"class_time"`
			ClassLoc    string     `json:"class_location"`
			ExamTime    string     `json:"exam_time"`
			DeptNo      string     `json:"dept_no"`
			Rows        []gradeRow `json:"rows"`
		}

		m := map[string]*courseGroup{}
		order := make([]string, 0)
		for _, r := range rows {
			key := r.CourseNo
			gp, ok := m[key]
			if !ok {
				gp = &courseGroup{
					CourseNo:    r.CourseNo,
					CourseName:  r.CourseName,
					TeacherNo:   r.TeacherNo,
					TeacherName: r.TeacherName,
					Hours:       r.Hours,
					Credits:     r.Credits,
					ClassTime:   r.ClassTime,
					ClassLoc:    r.ClassLoc,
					ExamTime:    r.ExamTime,
					DeptNo:      r.DeptNo,
				}
				m[key] = gp
				order = append(order, key)
			}
			gp.Rows = append(gp.Rows, gradeRow{
				StudentNo:   r.StudentNo,
				StudentName: r.StudentName,
				Gender:      r.Gender,
				UsualScore:  r.UsualScore,
				ExamScore:   r.ExamScore,
				FinalScore:  r.FinalScore,
			})
		}

		sort.Strings(order)
		out := make([]courseGroup, 0, len(order))
		for _, k := range order {
			out = append(out, *m[k])
		}
		return c.JSON(http.StatusOK, OK(out))
	})

	// PRD 3.6: 按课程批量录入/修改
	g.PUT("/grades/by-course", func(c echo.Context) error {
		claims := middleware.GetClaims(c)
		if claims == nil {
			return c.JSON(http.StatusUnauthorized, Err(40106, "missing claims"))
		}
		if claims.Role != "admin" && claims.Role != "teacher" {
			return c.JSON(http.StatusForbidden, Err(40301, "forbidden"))
		}

		var req putGradesByCourseReq
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		if req.CourseNo == "" || len(req.Items) == 0 {
			return c.JSON(http.StatusBadRequest, Err(40002, "course_no/items required"))
		}

		var course model.Course
		if err := gdb.Where("course_no = ?", req.CourseNo).First(&course).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40070, "course not found"))
		}

		return upsertGrades(c, gdb, func(item gradeItem) (uint, uint, error) {
			var stu model.Student
			if err := gdb.Where("student_no = ?", item.StudentNo).First(&stu).Error; err != nil {
				return 0, 0, err
			}
			return stu.ID, course.ID, nil
		}, req.Items)
	})

	// PRD 3.6: 按学生录入/修改
	g.PUT("/grades/by-student", func(c echo.Context) error {
		claims := middleware.GetClaims(c)
		if claims == nil {
			return c.JSON(http.StatusUnauthorized, Err(40106, "missing claims"))
		}
		if claims.Role != "admin" && claims.Role != "teacher" {
			return c.JSON(http.StatusForbidden, Err(40301, "forbidden"))
		}

		var req putGradesByStudentReq
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		if req.StudentNo == "" || len(req.Items) == 0 {
			return c.JSON(http.StatusBadRequest, Err(40002, "student_no/items required"))
		}

		var stu model.Student
		if err := gdb.Where("student_no = ?", req.StudentNo).First(&stu).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40071, "student not found"))
		}

		return upsertGrades(c, gdb, func(item gradeItem) (uint, uint, error) {
			var course model.Course
			if err := gdb.Where("course_no = ?", item.CourseNo).First(&course).Error; err != nil {
				return 0, 0, err
			}
			return stu.ID, course.ID, nil
		}, req.Items)
	})
}

func upsertGrades(c echo.Context, gdb *gorm.DB, resolve func(gradeItem) (studentID uint, courseID uint, err error), items []gradeItem) error {
	err := gdb.Transaction(func(tx *gorm.DB) error {
		for _, it := range items {
			sid, cid, err := resolve(it)
			if err != nil {
				return err
			}

			var g model.Grade
			findErr := tx.Where("student_id = ? AND course_id = ?", sid, cid).First(&g).Error
			if findErr != nil && findErr != gorm.ErrRecordNotFound {
				return findErr
			}
			g.StudentID = sid
			g.CourseID = cid
			g.UsualScore = it.UsualScore
			g.ExamScore = it.ExamScore
			g.FinalScore = it.FinalScore

			if findErr == gorm.ErrRecordNotFound {
				if err := tx.Create(&g).Error; err != nil {
					return err
				}
			} else {
				if err := tx.Save(&g).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		return c.JSON(http.StatusBadRequest, Err(40072, "upsert failed"))
	}
	return c.JSON(http.StatusOK, OK(map[string]any{"updated": true}))
}

