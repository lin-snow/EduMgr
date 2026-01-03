package service

import (
	"github.com/lin-snow/edumgr/internal/model"
	"github.com/lin-snow/edumgr/internal/pkg"
	"github.com/lin-snow/edumgr/internal/repository"
)

// TermService defines the interface for term business logic
type TermService interface {
	List() ([]model.Term, error)
	GetByID(id uint) (*model.Term, error)
	Create(term *model.Term) error
	Update(id uint, input *model.Term) (*model.Term, error)
	Delete(id uint) error
}

type termService struct {
	repo repository.TermRepository
}

// NewTermService creates a new TermService
func NewTermService(repo repository.TermRepository) TermService {
	return &termService{repo: repo}
}

func (s *termService) List() ([]model.Term, error) {
	items, err := s.repo.FindAll()
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeDBError, "database error", err)
	}
	return items, nil
}

func (s *termService) GetByID(id uint) (*model.Term, error) {
	term, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "term not found", err)
	}
	return term, nil
}

func (s *termService) Create(term *model.Term) error {
	if term.TermCode == "" || term.Name == "" {
		return pkg.NewAppError(pkg.ErrCodeMissingRequired, "term_code/name required")
	}
	term.ID = 0
	if err := s.repo.Create(term); err != nil {
		return pkg.WrapError(pkg.ErrCodeCreateFailed, "create failed", err)
	}
	return nil
}

func (s *termService) Update(id uint, input *model.Term) (*model.Term, error) {
	current, err := s.repo.FindByID(id)
	if err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeNotFound, "term not found", err)
	}

	// term_code can be updated if needed
	if input.TermCode != "" {
		current.TermCode = input.TermCode
	}
	if input.Name != "" {
		current.Name = input.Name
	}
	current.StartDate = input.StartDate
	current.EndDate = input.EndDate

	if err := s.repo.Update(current); err != nil {
		return nil, pkg.WrapError(pkg.ErrCodeUpdateFailed, "update failed", err)
	}
	return current, nil
}

func (s *termService) Delete(id uint) error {
	if err := s.repo.Delete(id); err != nil {
		return pkg.WrapError(pkg.ErrCodeDeleteFailed, "delete failed", err)
	}
	return nil
}
