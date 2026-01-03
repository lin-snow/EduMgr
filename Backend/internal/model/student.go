package model

import "time"

type Student struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	StudentNo  string    `gorm:"uniqueIndex;not null" json:"student_no"`
	Name       string    `gorm:"not null" json:"name"`
	Gender     string    `gorm:"not null;default:''" json:"gender"`
	BirthDate  *time.Time `json:"birth_date,omitempty"`
	EntryScore *float64   `json:"entry_score,omitempty"`
	DeptID     uint      `gorm:"not null;index" json:"dept_id"`
	Status     string    `gorm:"not null;default:'in_school'" json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

