package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"

	"github.com/lin-snow/edumgr/internal/config"
)

type Claims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

const CtxClaimsKey = "auth_claims"

type apiResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func jsonErr(c echo.Context, httpStatus int, code int, message string) error {
	return c.JSON(httpStatus, apiResponse{Code: code, Message: message})
}

func JWT(cfg config.Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			h := c.Request().Header.Get("Authorization")
			if h == "" {
				return jsonErr(c, http.StatusUnauthorized, 40101, "missing Authorization header")
			}
			parts := strings.SplitN(h, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				return jsonErr(c, http.StatusUnauthorized, 40102, "invalid Authorization header")
			}
			tokenStr := strings.TrimSpace(parts[1])
			if tokenStr == "" {
				return jsonErr(c, http.StatusUnauthorized, 40103, "empty token")
			}

			token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
				return []byte(cfg.JWTSecret), nil
			}, jwt.WithLeeway(30*time.Second))
			if err != nil || token == nil || !token.Valid {
				return jsonErr(c, http.StatusUnauthorized, 40104, "invalid token")
			}

			claims, ok := token.Claims.(*Claims)
			if !ok || claims == nil {
				return jsonErr(c, http.StatusUnauthorized, 40105, "invalid claims")
			}

			c.Set(CtxClaimsKey, claims)
			return next(c)
		}
	}
}

func GetClaims(c echo.Context) *Claims {
	v := c.Get(CtxClaimsKey)
	if v == nil {
		return nil
	}
	claims, _ := v.(*Claims)
	return claims
}

