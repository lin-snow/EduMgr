package middleware

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

// WriteAdminOnly enforces:
// - GET/HEAD/OPTIONS: allowed for any role already permitted by upstream role middleware
// - POST/PUT/PATCH/DELETE: only admin can pass
func WriteAdminOnly() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			method := strings.ToUpper(c.Request().Method)
			switch method {
			case http.MethodGet, http.MethodHead, http.MethodOptions:
				return next(c)
			default:
				claims := GetClaims(c)
				if claims == nil {
					return jsonErr(c, http.StatusUnauthorized, 40106, "missing claims")
				}
				if claims.Role != "admin" {
					return jsonErr(c, http.StatusForbidden, 40301, "forbidden")
				}
				return next(c)
			}
		}
	}
}

