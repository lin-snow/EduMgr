package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func RequireRole(roles ...string) echo.MiddlewareFunc {
	allow := map[string]struct{}{}
	for _, r := range roles {
		allow[r] = struct{}{}
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			claims := GetClaims(c)
			if claims == nil {
				return jsonErr(c, http.StatusUnauthorized, 40106, "missing claims")
			}
			if _, ok := allow[claims.Role]; !ok {
				return jsonErr(c, http.StatusForbidden, 40301, "forbidden")
			}
			return next(c)
		}
	}
}

