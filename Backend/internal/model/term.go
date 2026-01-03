package model

import "time"

type Term struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	TermCode  string     `gorm:"uniqueIndex;not null" json:"term_code"`
	Name      string     `gorm:"not null" json:"name"`
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

