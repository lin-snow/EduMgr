//go:build wireinject
// +build wireinject

package main

import (
	"github.com/google/wire"
	"gorm.io/gorm"

	"github.com/lin-snow/edumgr/internal/config"
	"github.com/lin-snow/edumgr/internal/handler"
	"github.com/lin-snow/edumgr/internal/repository"
	"github.com/lin-snow/edumgr/internal/server"
	"github.com/lin-snow/edumgr/internal/service"
)

// InitializeHandlers creates all handlers with dependency injection
func InitializeHandlers(db *gorm.DB, cfg config.Config) (*server.Handlers, error) {
	wire.Build(
		repository.ProviderSet,
		service.ProviderSet,
		handler.ProviderSet,
		server.ProviderSet,
	)
	return nil, nil
}
