package handler

import (
	"net/http"
	"sort"
	"strings"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// PRD 5.1 / 5.2:
// - 成绩登记表：课程信息 + 选课学生名单（学号升序）+ 成绩栏位（可空）
// - 成绩报表：在登记表基础上，带成绩 + 分段统计（人数/比例）

type reportQuery struct {
	CourseNo    string
	CourseName  string
	TeacherName string
	DeptNo      string
}

func RegisterReports(g *echo.Group, gdb *gorm.DB) {
	g.GET("/reports/grade-roster", func(c echo.Context) error {
		q := reportQuery{
			CourseNo:    c.QueryParam("course_no"),
			CourseName:  c.QueryParam("course_name"),
			TeacherName: c.QueryParam("teacher_name"),
			DeptNo:      c.QueryParam("dept_no"),
		}
		out, err := buildRoster(gdb, q, false)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
		}
		return c.JSON(http.StatusOK, OK(out))
	})

	g.GET("/reports/grade-report", func(c echo.Context) error {
		q := reportQuery{
			CourseNo:    c.QueryParam("course_no"),
			CourseName:  c.QueryParam("course_name"),
			TeacherName: c.QueryParam("teacher_name"),
			DeptNo:      c.QueryParam("dept_no"),
		}
		out, err := buildRoster(gdb, q, true)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
		}
		return c.JSON(http.StatusOK, OK(out))
	})
}

type rosterStudent struct {
	StudentNo  string   `json:"student_no"`
	Name       string   `json:"name"`
	Gender     string   `json:"gender"`
	UsualScore *float64 `json:"usual_score,omitempty"`
	ExamScore  *float64 `json:"exam_score,omitempty"`
	FinalScore *float64 `json:"final_score,omitempty"`
}

type scoreDist struct {
	Ge90Count int     `json:"ge90_count"`
	Ge90Rate  float64 `json:"ge90_rate"`
	Ge80Count int     `json:"ge80_count"`
	Ge80Rate  float64 `json:"ge80_rate"`
	Ge70Count int     `json:"ge70_count"`
	Ge70Rate  float64 `json:"ge70_rate"`
	Ge60Count int     `json:"ge60_count"`
	Ge60Rate  float64 `json:"ge60_rate"`
	Lt60Count int     `json:"lt60_count"`
	Lt60Rate  float64 `json:"lt60_rate"`
}

type rosterCourse struct {
	CourseNo    string `json:"course_no"`
	CourseName  string `json:"course_name"`
	TeacherNo   string `json:"teacher_no"`
	TeacherName string `json:"teacher_name"`
	Hours       int    `json:"hours"`
	Credits     int    `json:"credits"`
	ClassTime   string `json:"class_time"`
	ClassLoc    string `json:"class_location"`
	ExamTime    string `json:"exam_time"`

	Students []rosterStudent `json:"students"`
	Dist     *scoreDist      `json:"dist,omitempty"`
}

func buildRoster(gdb *gorm.DB, q reportQuery, withGrades bool) ([]rosterCourse, error) {
	type row struct {
		CourseNo    string  `json:"course_no"`
		CourseName  string  `json:"course_name"`
		TeacherNo   string  `json:"teacher_no"`
		TeacherName string  `json:"teacher_name"`
		Hours       int     `json:"hours"`
		Credits     int     `json:"credits"`
		ClassTime   string  `json:"class_time"`
		ClassLoc    string  `json:"class_location"`
		ExamTime    string  `json:"exam_time"`
		DeptNo      string  `json:"dept_no"`
		StudentNo   string  `json:"student_no"`
		StudentName string  `json:"student_name"`
		Gender      string  `json:"gender"`
		UsualScore  *float64 `json:"usual_score"`
		ExamScore   *float64 `json:"exam_score"`
		FinalScore  *float64 `json:"final_score"`
	}

	selectCols := `
		courses.course_no, courses.name AS course_name,
		staff.staff_no AS teacher_no, staff.name AS teacher_name,
		courses.hours, courses.credits, courses.class_time, courses.class_location, courses.exam_time,
		departments.dept_no,
		students.student_no, students.name AS student_name, students.gender
	`
	if withGrades {
		selectCols += `, grades.usual_score, grades.exam_score, grades.final_score`
	} else {
		// keep shape stable
		selectCols += `, NULL::numeric AS usual_score, NULL::numeric AS exam_score, NULL::numeric AS final_score`
	}

	qq := gdb.Table("enrollments").
		Select(selectCols).
		Joins("JOIN students ON students.id = enrollments.student_id").
		Joins("JOIN courses ON courses.id = enrollments.course_id").
		Joins("JOIN staff ON staff.id = courses.teacher_id").
		Joins("JOIN departments ON departments.id = students.dept_id")

	if withGrades {
		qq = qq.Joins("LEFT JOIN grades ON grades.student_id = students.id AND grades.course_id = courses.id")
	}

	if q.CourseNo != "" {
		qq = qq.Where("courses.course_no = ?", q.CourseNo)
	}
	if q.CourseName != "" {
		qq = qq.Where("courses.name ILIKE ?", "%"+q.CourseName+"%")
	}
	if q.TeacherName != "" {
		qq = qq.Where("staff.name ILIKE ?", "%"+q.TeacherName+"%")
	}
	if q.DeptNo != "" {
		// PRD: 按系号输出“本系所有教师担任的课程”
		// 解释：筛选 courses.teacher 所在系（而非学生所在系）
		qq = qq.Joins("JOIN departments AS teacher_dept ON teacher_dept.id = staff.dept_id").
			Where("teacher_dept.dept_no = ?", q.DeptNo)
	}

	var rows []row
	if err := qq.Order("courses.course_no asc, students.student_no asc").Scan(&rows).Error; err != nil {
		return nil, err
	}

	m := map[string]*rosterCourse{}
	order := make([]string, 0)
	for _, r := range rows {
		key := r.CourseNo
		rc, ok := m[key]
		if !ok {
			rc = &rosterCourse{
				CourseNo:    r.CourseNo,
				CourseName:  r.CourseName,
				TeacherNo:   r.TeacherNo,
				TeacherName: r.TeacherName,
				Hours:       r.Hours,
				Credits:     r.Credits,
				ClassTime:   r.ClassTime,
				ClassLoc:    r.ClassLoc,
				ExamTime:    r.ExamTime,
			}
			m[key] = rc
			order = append(order, key)
		}
		rc.Students = append(rc.Students, rosterStudent{
			StudentNo:  r.StudentNo,
			Name:       r.StudentName,
			Gender:     r.Gender,
			UsualScore: r.UsualScore,
			ExamScore:  r.ExamScore,
			FinalScore: r.FinalScore,
		})
	}

	sort.Strings(order)
	out := make([]rosterCourse, 0, len(order))
	for _, k := range order {
		rc := *m[k]
		// ensure student_no asc (already ordered), but keep stable if DB collation differs
		sort.SliceStable(rc.Students, func(i, j int) bool { return strings.Compare(rc.Students[i].StudentNo, rc.Students[j].StudentNo) < 0 })
		if withGrades {
			rc.Dist = calcDist(rc.Students)
		}
		out = append(out, rc)
	}
	return out, nil
}

func calcDist(students []rosterStudent) *scoreDist {
	total := 0
	cnt90, cnt80, cnt70, cnt60, cntlt := 0, 0, 0, 0, 0
	for _, s := range students {
		if s.FinalScore == nil {
			continue
		}
		total++
		v := *s.FinalScore
		switch {
		case v >= 90:
			cnt90++
		case v >= 80:
			cnt80++
		case v >= 70:
			cnt70++
		case v >= 60:
			cnt60++
		default:
			cntlt++
		}
	}
	if total == 0 {
		return &scoreDist{}
	}
	r := func(n int) float64 { return float64(n) / float64(total) }
	return &scoreDist{
		Ge90Count: cnt90, Ge90Rate: r(cnt90),
		Ge80Count: cnt80, Ge80Rate: r(cnt80),
		Ge70Count: cnt70, Ge70Rate: r(cnt70),
		Ge60Count: cnt60, Ge60Rate: r(cnt60),
		Lt60Count: cntlt, Lt60Rate: r(cntlt),
	}
}

