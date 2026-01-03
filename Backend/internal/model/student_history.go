package model

import "time"

type StudentHistory struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	StudentNo     string     `gorm:"not null" json:"student_no"`
	Name          string     `gorm:"not null" json:"name"`
	Gender        string     `gorm:"not null;default:''" json:"gender"`
	BirthDate     *time.Time `json:"birth_date,omitempty"`
	EntryScore    *float64   `json:"entry_score,omitempty"`
	DeptID        uint       `gorm:"not null" json:"dept_id"`
	Status        string     `gorm:"not null" json:"status"`
	ArchivedAt    time.Time  `gorm:"not null" json:"archived_at"`
	ArchiveReason string     `gorm:"not null" json:"archive_reason"`
}

