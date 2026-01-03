package service

import (
	"sort"
	"strings"

	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

// RosterStudent represents a student in the roster
type RosterStudent struct {
	StudentNo  string   `json:"student_no"`
	Name       string   `json:"name"`
	Gender     string   `json:"gender"`
	UsualScore *float64 `json:"usual_score,omitempty"`
	ExamScore  *float64 `json:"exam_score,omitempty"`
	FinalScore *float64 `json:"final_score,omitempty"`
}

// ScoreDist represents score distribution
type ScoreDist struct {
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

// RosterCourse represents a course in the roster
type RosterCourse struct {
	CourseNo    string          `json:"course_no"`
	CourseName  string          `json:"course_name"`
	TeacherNo   string          `json:"teacher_no"`
	TeacherName string          `json:"teacher_name"`
	Hours       int             `json:"hours"`
	Credits     int             `json:"credits"`
	ClassTime   string          `json:"class_time"`
	ClassLoc    string          `json:"class_location"`
	ExamTime    string          `json:"exam_time"`
	Students    []RosterStudent `json:"students"`
	Dist        *ScoreDist      `json:"dist,omitempty"`
}

// ReportQueryParams represents query parameters for reports
type ReportQueryParams struct {
	CourseNo    string
	CourseName  string
	TeacherName string
	DeptNo      string
}

// ReportService defines the interface for report business logic
type ReportService interface {
	GetGradeRoster(params ReportQueryParams) ([]RosterCourse, error)
	GetGradeReport(params ReportQueryParams) ([]RosterCourse, error)
}

type reportService struct {
	repo repository.ReportRepository
}

// NewReportService creates a new ReportService
func NewReportService(repo repository.ReportRepository) ReportService {
	return &reportService{repo: repo}
}

func (s *reportService) GetGradeRoster(params ReportQueryParams) ([]RosterCourse, error) {
	return s.buildRoster(params, false)
}

func (s *reportService) GetGradeReport(params ReportQueryParams) ([]RosterCourse, error) {
	return s.buildRoster(params, true)
}

func (s *reportService) buildRoster(params ReportQueryParams, withGrades bool) ([]RosterCourse, error) {
	repoParams := repository.ReportQueryParams{
		CourseNo:    params.CourseNo,
		CourseName:  params.CourseName,
		TeacherName: params.TeacherName,
		DeptNo:      params.DeptNo,
	}

	rows, err := s.repo.GetRosterData(repoParams, withGrades)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}

	// Group by course
	m := make(map[string]*RosterCourse)
	order := make([]string, 0)
	for _, r := range rows {
		key := r.CourseNo
		rc, ok := m[key]
		if !ok {
			rc = &RosterCourse{
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
		rc.Students = append(rc.Students, RosterStudent{
			StudentNo:  r.StudentNo,
			Name:       r.StudentName,
			Gender:     r.Gender,
			UsualScore: r.UsualScore,
			ExamScore:  r.ExamScore,
			FinalScore: r.FinalScore,
		})
	}

	sort.Strings(order)
	result := make([]RosterCourse, 0, len(order))
	for _, k := range order {
		rc := *m[k]
		// Ensure students are sorted by student_no
		sort.SliceStable(rc.Students, func(i, j int) bool {
			return strings.Compare(rc.Students[i].StudentNo, rc.Students[j].StudentNo) < 0
		})
		if withGrades {
			rc.Dist = s.calcDist(rc.Students)
		}
		result = append(result, rc)
	}
	return result, nil
}

func (s *reportService) calcDist(students []RosterStudent) *ScoreDist {
	total := 0
	cnt90, cnt80, cnt70, cnt60, cntlt := 0, 0, 0, 0, 0
	for _, stu := range students {
		if stu.FinalScore == nil {
			continue
		}
		total++
		v := *stu.FinalScore
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
		return &ScoreDist{}
	}
	r := func(n int) float64 { return float64(n) / float64(total) }
	return &ScoreDist{
		Ge90Count: cnt90, Ge90Rate: r(cnt90),
		Ge80Count: cnt80, Ge80Rate: r(cnt80),
		Ge70Count: cnt70, Ge70Rate: r(cnt70),
		Ge60Count: cnt60, Ge60Rate: r(cnt60),
		Lt60Count: cntlt, Lt60Rate: r(cntlt),
	}
}
