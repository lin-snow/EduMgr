package model

import "time"

type Course struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	CourseNo      string    `gorm:"uniqueIndex;not null" json:"course_no"`
	Name          string    `gorm:"not null" json:"name"`
	TeacherID     uint      `gorm:"not null;index" json:"teacher_id"`
	Hours         int       `gorm:"not null;default:0" json:"hours"`
	Credits       int       `gorm:"not null;default:0" json:"credits"`
	ClassTime     string    `gorm:"not null;default:''" json:"class_time"`
	ClassLocation string    `gorm:"not null;default:''" json:"class_location"`
	ExamTime      string    `gorm:"not null;default:''" json:"exam_time"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

