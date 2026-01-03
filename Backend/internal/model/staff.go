package model

import "time"

type Staff struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	StaffNo           string    `gorm:"uniqueIndex;not null" json:"staff_no"`
	Name              string    `gorm:"not null" json:"name"`
	Gender            string    `gorm:"not null;default:''" json:"gender"`
	BirthMonth        string    `gorm:"not null;default:''" json:"birth_month"`
	DeptID            uint      `gorm:"not null;index" json:"dept_id"`
	Title             string    `gorm:"not null;default:''" json:"title"`
	Major             string    `gorm:"not null;default:''" json:"major"`
	TeachingDirection string    `gorm:"not null;default:''" json:"teaching_direction"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// TableName overrides the table name used by GORM
func (Staff) TableName() string {
	return "staff"
}
