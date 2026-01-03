package repository

import (
	"github.com/lin-snow/edumgr/internal/model"
	"gorm.io/gorm"
)

// TermRepository defines the interface for term data access
type TermRepository interface {
	FindAll() ([]model.Term, error)
	FindByID(id uint) (*model.Term, error)
	FindByTermCode(termCode string) (*model.Term, error)
	Create(term *model.Term) error
	Update(term *model.Term) error
	Delete(id uint) error
}

type termRepo struct {
	db *gorm.DB
}

// NewTermRepository creates a new TermRepository
func NewTermRepository(db *gorm.DB) TermRepository {
	return &termRepo{db: db}
}

func (r *termRepo) FindAll() ([]model.Term, error) {
	var items []model.Term
	if err := r.db.Order("term_code desc").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *termRepo) FindByID(id uint) (*model.Term, error) {
	var term model.Term
	if err := r.db.First(&term, id).Error; err != nil {
		return nil, err
	}
	return &term, nil
}

func (r *termRepo) FindByTermCode(termCode string) (*model.Term, error) {
	var term model.Term
	if err := r.db.Where("term_code = ?", termCode).First(&term).Error; err != nil {
		return nil, err
	}
	return &term, nil
}

func (r *termRepo) Create(term *model.Term) error {
	return r.db.Create(term).Error
}

func (r *termRepo) Update(term *model.Term) error {
	return r.db.Save(term).Error
}

func (r *termRepo) Delete(id uint) error {
	return r.db.Delete(&model.Term{}, id).Error
}
