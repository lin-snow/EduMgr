package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/lin-snow/edumgr/internal/config"
	"github.com/lin-snow/edumgr/internal/db"
	"github.com/lin-snow/edumgr/internal/handler"
	appmw "github.com/lin-snow/edumgr/internal/middleware"
)

func main() {
	cfg := config.Load()

	gdb, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("db connect failed: %v", err)
	}

	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.Recover())
	e.Use(middleware.RequestID())
	e.Use(middleware.Logger())
	e.Use(middleware.CORS())

	// Public routes
	handler.RegisterHealth(e)
	handler.RegisterAuth(e, gdb, cfg)

	// Protected API group
	api := e.Group("/api/v1")
	api.Use(appmw.JWT(cfg))

	api.GET("/ping", func(c echo.Context) error {
		return c.JSON(http.StatusOK, handler.OK(map[string]any{"pong": true}))
	}, appmw.RequireRole("admin", "teacher", "student"))

	// CRUD (read: admin/teacher; write: admin)
	ro := api.Group("")
	ro.Use(appmw.RequireRole("admin", "teacher"))
	ro.Use(appmw.WriteAdminOnly())
	handler.RegisterDepartments(ro, gdb)
	handler.RegisterStudents(ro, gdb)
	handler.RegisterStaff(ro, gdb)
	handler.RegisterCourses(ro, gdb)

	// Write endpoints are currently mixed into the same handlers.
	// For strict RBAC, we will split into separate route groups in later milestones.

	// Terms & enrollments
	termAPI := api.Group("")
	termAPI.Use(appmw.RequireRole("admin", "teacher", "student"))
	handler.RegisterTerms(termAPI, gdb)

	enrAPI := api.Group("")
	enrAPI.Use(appmw.RequireRole("admin", "student"))
	handler.RegisterEnrollments(enrAPI, gdb)

	// Grades (teacher/admin)
	gradeAPI := api.Group("")
	gradeAPI.Use(appmw.RequireRole("admin", "teacher"))
	handler.RegisterGrades(gradeAPI, gdb)

	// Reports (teacher/admin)
	reportAPI := api.Group("")
	reportAPI.Use(appmw.RequireRole("admin", "teacher"))
	handler.RegisterReports(reportAPI, gdb)

	srv := &http.Server{
		Addr:         cfg.Addr(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("api listening on %s", cfg.Addr())
		if err := e.StartServer(srv); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server start failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = e.Shutdown(ctx)
}

