package server

import "github.com/google/wire"

// ProviderSet is the wire provider set for server
var ProviderSet = wire.NewSet(
	NewHandlers,
	NewServices,
)
