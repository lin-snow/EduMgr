package pkg

// Pagination represents pagination parameters
type Pagination struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
}

// PaginatedResult represents a paginated result
type PaginatedResult[T any] struct {
	Items    []T   `json:"items"`
	Total    int64 `json:"total"`
	Page     int   `json:"page"`
	PageSize int   `json:"page_size"`
	Pages    int   `json:"pages"`
}

// NewPagination creates a new Pagination with default values
func NewPagination(page, pageSize int) Pagination {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return Pagination{Page: page, PageSize: pageSize}
}

// Offset returns the offset for the pagination
func (p Pagination) Offset() int {
	return (p.Page - 1) * p.PageSize
}

// NewPaginatedResult creates a new PaginatedResult
func NewPaginatedResult[T any](items []T, total int64, page, pageSize int) PaginatedResult[T] {
	pages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		pages++
	}
	return PaginatedResult[T]{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
		Pages:    pages,
	}
}
