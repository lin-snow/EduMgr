package model

import "time"

type Enrollment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"not null;index" json:"student_id"`
	CourseID  uint      `gorm:"not null;index" json:"course_id"`
	TermID    uint      `gorm:"not null;index" json:"term_id"`
	CreatedAt time.Time `json:"created_at"`
}

