package repository

import (
	"github.com/lin-snow/edumgr/internal/model"
	"gorm.io/gorm"
)

// CourseWithTeacher represents a course with teacher info
type CourseWithTeacher struct {
	model.Course
	TeacherName string `json:"teacher_name"`
	TeacherNo   string `json:"teacher_no"`
}

// CourseCredits represents course ID and credits
type CourseCredits struct {
	ID      uint
	Credits int
}

// CourseQueryParams represents course query parameters
type CourseQueryParams struct {
	CourseNo    string
	Name        string
	TeacherName string
	Page        int
	PageSize    int
}

// CourseRepository defines the interface for course data access
type CourseRepository interface {
	FindAll(courseNo, name, teacherName string) ([]CourseWithTeacher, error)
	FindAllPaginated(params CourseQueryParams) ([]CourseWithTeacher, int64, error)
	FindByID(id uint) (*model.Course, error)
	FindByCourseNo(courseNo string) (*model.Course, error)
	FindByCourseNos(courseNos []string) ([]CourseCredits, error)
	Create(course *model.Course) error
	Update(course *model.Course) error
	Delete(id uint) error
	CountEnrollments(courseID uint) (int64, error)
	CountGrades(courseID uint) (int64, error)
}

type courseRepo struct {
	db *gorm.DB
}

// NewCourseRepository creates a new CourseRepository
func NewCourseRepository(db *gorm.DB) CourseRepository {
	return &courseRepo{db: db}
}

func (r *courseRepo) FindAll(courseNo, name, teacherName string) ([]CourseWithTeacher, error) {
	q := r.db.Table("courses").
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

	var items []CourseWithTeacher
	if err := q.Order("courses.course_no asc").Scan(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *courseRepo) FindAllPaginated(params CourseQueryParams) ([]CourseWithTeacher, int64, error) {
	q := r.db.Table("courses").
		Select("courses.*, staff.name AS teacher_name, staff.staff_no AS teacher_no").
		Joins("JOIN staff ON staff.id = courses.teacher_id")

	if params.CourseNo != "" {
		q = q.Where("courses.course_no = ?", params.CourseNo)
	}
	if params.Name != "" {
		q = q.Where("courses.name ILIKE ?", "%"+params.Name+"%")
	}
	if params.TeacherName != "" {
		q = q.Where("staff.name ILIKE ?", "%"+params.TeacherName+"%")
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		q = q.Offset(offset).Limit(params.PageSize)
	}

	var items []CourseWithTeacher
	if err := q.Order("courses.course_no asc").Scan(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *courseRepo) FindByID(id uint) (*model.Course, error) {
	var course model.Course
	if err := r.db.First(&course, id).Error; err != nil {
		return nil, err
	}
	return &course, nil
}

func (r *courseRepo) FindByCourseNo(courseNo string) (*model.Course, error) {
	var course model.Course
	if err := r.db.Where("course_no = ?", courseNo).First(&course).Error; err != nil {
		return nil, err
	}
	return &course, nil
}

func (r *courseRepo) FindByCourseNos(courseNos []string) ([]CourseCredits, error) {
	var result []CourseCredits
	if err := r.db.Table("courses").
		Select("id, credits").
		Where("course_no IN ?", courseNos).
		Scan(&result).Error; err != nil {
		return nil, err
	}
	return result, nil
}

func (r *courseRepo) Create(course *model.Course) error {
	return r.db.Create(course).Error
}

func (r *courseRepo) Update(course *model.Course) error {
	return r.db.Save(course).Error
}

func (r *courseRepo) Delete(id uint) error {
	return r.db.Delete(&model.Course{}, id).Error
}

func (r *courseRepo) CountEnrollments(courseID uint) (int64, error) {
	var count int64
	err := r.db.Table("enrollments").Where("course_id = ?", courseID).Count(&count).Error
	return count, err
}

func (r *courseRepo) CountGrades(courseID uint) (int64, error) {
	var count int64
	err := r.db.Table("grades").Where("course_id = ?", courseID).Count(&count).Error
	return count, err
}
