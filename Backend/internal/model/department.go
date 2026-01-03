package model

import "time"

type Department struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	DeptNo    string    `gorm:"uniqueIndex;not null" json:"dept_no"`
	Name      string    `gorm:"not null" json:"name"`
	Intro     string    `gorm:"not null;default:''" json:"intro"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

