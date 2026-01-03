package model

import "time"

type Grade struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	StudentID  uint      `gorm:"not null;index" json:"student_id"`
	CourseID   uint      `gorm:"not null;index" json:"course_id"`
	UsualScore *float64  `json:"usual_score,omitempty"`
	ExamScore  *float64  `json:"exam_score,omitempty"`
	FinalScore *float64  `json:"final_score,omitempty"`
	UpdatedAt  time.Time `json:"updated_at"`
}

