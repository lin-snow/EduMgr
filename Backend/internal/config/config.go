package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	AppEnv string
	Port   int

	DBHost    string
	DBPort    int
	DBUser    string
	DBPass    string
	DBName    string
	DBSSLMode string

	JWTSecret         string
	JWTExpiresMinutes int
}

func Load() Config {
	return Config{
		AppEnv: env("APP_ENV", "dev"),
		Port:   envInt("APP_PORT", 8080),

		DBHost:    env("DB_HOST", "localhost"),
		DBPort:    envInt("DB_PORT", 5432),
		DBUser:    env("DB_USER", "edumgr"),
		DBPass:    env("DB_PASSWORD", "edumgr"),
		DBName:    env("DB_NAME", "edumgr"),
		DBSSLMode: env("DB_SSLMODE", "disable"),

		JWTSecret:         env("JWT_SECRET", "change-me-in-prod"),
		JWTExpiresMinutes: envInt("JWT_EXPIRES_MINUTES", 720),
	}
}

func (c Config) Addr() string {
	return fmt.Sprintf(":%d", c.Port)
}

func (c Config) PostgresDSN() string {
	// Note: pgx supports these keywords; gorm postgres driver accepts them.
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPass, c.DBName, c.DBSSLMode,
	)
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envInt(key string, def int) int {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

