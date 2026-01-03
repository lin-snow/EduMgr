package handler

import (
	"strconv"

	"github.com/labstack/echo/v4"
)

// pathUint extracts a uint path parameter
func pathUint(c echo.Context, name string) (uint, error) {
	s := c.Param(name)
	n, err := strconv.ParseUint(s, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(n), nil
}
