package handler

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/middleware"
	"github.com/lin-snow/edumgr/internal/model"
)

type enrollReq struct {
	TermCode   string   `json:"term_code"`
	StudentNo  string   `json:"student_no"`
	StudentNos []string `json:"student_nos"`
	CourseNos  []string `json:"course_nos"`
}

func RegisterEnrollments(g *echo.Group, gdb *gorm.DB) {
	g.POST("/enrollments", func(c echo.Context) error {
		claims := middleware.GetClaims(c)
		if claims == nil {
			return c.JSON(http.StatusUnauthorized, Err(40106, "missing claims"))
		}

		var req enrollReq
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40001, "invalid json"))
		}
		if req.TermCode == "" || len(req.CourseNos) == 0 {
			return c.JSON(http.StatusBadRequest, Err(40002, "term_code/course_nos required"))
		}

		// Resolve term
		var term model.Term
		if err := gdb.Where("term_code = ?", req.TermCode).First(&term).Error; err != nil {
			return c.JSON(http.StatusBadRequest, Err(40060, "term not found"))
		}

		// Resolve courses (and credits)
		type courseRow struct {
			ID      uint
			Credits int
		}
		var courseRows []courseRow
		if err := gdb.Table("courses").
			Select("id, credits").
			Where("course_no IN ?", req.CourseNos).
			Scan(&courseRows).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
		}
		if len(courseRows) != len(req.CourseNos) {
			return c.JSON(http.StatusBadRequest, Err(40061, "some courses not found"))
		}

		courseIDs := make([]uint, 0, len(courseRows))
		courseCredit := map[uint]int{}
		for _, r := range courseRows {
			courseIDs = append(courseIDs, r.ID)
			courseCredit[r.ID] = r.Credits
		}

		// Resolve students according to role
		var studentIDs []uint
		switch claims.Role {
		case "admin":
			studentNos := req.StudentNos
			if len(studentNos) == 0 {
				if req.StudentNo == "" {
					return c.JSON(http.StatusBadRequest, Err(40002, "student_no or student_nos required"))
				}
				studentNos = []string{req.StudentNo}
			}
			var students []model.Student
			if err := gdb.Where("student_no IN ?", studentNos).Find(&students).Error; err != nil {
				return c.JSON(http.StatusInternalServerError, Err(50010, "db error"))
			}
			if len(students) != len(studentNos) {
				return c.JSON(http.StatusBadRequest, Err(40062, "some students not found"))
			}
			for _, s := range students {
				studentIDs = append(studentIDs, s.ID)
			}
		case "student":
			// Student can only enroll self: lookup bound student_id from users
			var u model.User
			if err := gdb.First(&u, claims.UserID).Error; err != nil || u.StudentID == nil {
				return c.JSON(http.StatusForbidden, Err(40302, "student not bound"))
			}
			studentIDs = []uint{*u.StudentID}
		default:
			return c.JSON(http.StatusForbidden, Err(40301, "forbidden"))
		}

		// For each student, enroll courses with credit cap check (<=15 per term)
		type created struct {
			StudentID uint   `json:"student_id"`
			TermID    uint   `json:"term_id"`
			CourseIDs []uint `json:"course_ids"`
		}
		var out []created

		for _, sid := range studentIDs {
			err := gdb.Transaction(func(tx *gorm.DB) error {
				// Existing credits in this term
				var current int
				row := tx.Table("enrollments").
					Select("COALESCE(SUM(courses.credits), 0) AS total").
					Joins("JOIN courses ON courses.id = enrollments.course_id").
					Where("enrollments.student_id = ? AND enrollments.term_id = ?", sid, term.ID).
					Row()
				if scanErr := row.Scan(&current); scanErr != nil {
					return scanErr
				}

				// Reject duplicates early
				var dupCnt int64
				if err := tx.Table("enrollments").
					Where("student_id = ? AND course_id IN ?", sid, courseIDs).
					Count(&dupCnt).Error; err != nil {
					return err
				}
				if dupCnt > 0 {
					return echo.NewHTTPError(http.StatusBadRequest, Err(40063, "duplicate enrollment"))
				}

				add := 0
				for _, cid := range courseIDs {
					add += courseCredit[cid]
				}
				if current+add > 15 {
					return echo.NewHTTPError(http.StatusBadRequest, Err(40064, "credit limit exceeded"))
				}

				enrs := make([]model.Enrollment, 0, len(courseIDs))
				for _, cid := range courseIDs {
					enrs = append(enrs, model.Enrollment{
						StudentID: sid,
						CourseID:  cid,
						TermID:    term.ID,
					})
				}
				if err := tx.Create(&enrs).Error; err != nil {
					return err
				}

				out = append(out, created{StudentID: sid, TermID: term.ID, CourseIDs: courseIDs})
				return nil
			})
			if err != nil {
				var he *echo.HTTPError
				if errors.As(err, &he) {
					// handler.Err payload is already in he.Message
					return c.JSON(he.Code, he.Message)
				}
				return c.JSON(http.StatusBadRequest, Err(40065, "enroll failed"))
			}
		}

		return c.JSON(http.StatusOK, OK(out))
	})

	g.DELETE("/enrollments/:id", func(c echo.Context) error {
		claims := middleware.GetClaims(c)
		if claims == nil {
			return c.JSON(http.StatusUnauthorized, Err(40106, "missing claims"))
		}
		id, err := pathUint(c, "id")
		if err != nil {
			return c.JSON(http.StatusBadRequest, Err(40003, "invalid id"))
		}

		// Load enrollment
		var enr model.Enrollment
		if err := gdb.First(&enr, id).Error; err != nil {
			return c.JSON(http.StatusNotFound, Err(40401, "not found"))
		}

		// Student can only delete own enrollment
		if claims.Role == "student" {
			var u model.User
			if err := gdb.First(&u, claims.UserID).Error; err != nil || u.StudentID == nil || *u.StudentID != enr.StudentID {
				return c.JSON(http.StatusForbidden, Err(40301, "forbidden"))
			}
		} else if claims.Role != "admin" {
			return c.JSON(http.StatusForbidden, Err(40301, "forbidden"))
		}

		// PRD: 删除选课记录时需同步处理成绩数据
		if err := gdb.Transaction(func(tx *gorm.DB) error {
			if err := tx.Table("grades").Where("student_id = ? AND course_id = ?", enr.StudentID, enr.CourseID).Delete(nil).Error; err != nil {
				return err
			}
			if err := tx.Delete(&model.Enrollment{}, enr.ID).Error; err != nil {
				return err
			}
			return nil
		}); err != nil {
			return c.JSON(http.StatusBadRequest, Err(40066, "delete failed"))
		}

		return c.JSON(http.StatusOK, OK(map[string]any{"deleted": true}))
	})
}

