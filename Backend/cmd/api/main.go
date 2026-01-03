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
	"github.com/lin-snow/edumgr/internal/server"
)

func main() {
	cfg := config.Load()

	gdb, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("db connect failed: %v", err)
	}

	// Initialize all handlers using Wire
	handlers, err := InitializeHandlers(gdb, cfg)
	if err != nil {
		log.Fatalf("initialize handlers failed: %v", err)
	}

	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.Recover())
	e.Use(middleware.RequestID())
	e.Use(middleware.Logger())
	e.Use(middleware.CORS())

	// Register routes
	registerRoutes(e, handlers, cfg)

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

// registerRoutes registers all HTTP routes
func registerRoutes(e *echo.Echo, h *server.Handlers, cfg config.Config) {
	// Public routes
	h.Health.Register(e)
	h.Auth.Register(e)

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
	h.Department.Register(ro)
	h.Student.Register(ro)
	h.Staff.Register(ro)
	h.Course.Register(ro)

	// Terms (all authenticated users can view)
	termAPI := api.Group("")
	termAPI.Use(appmw.RequireRole("admin", "teacher", "student"))
	h.Term.Register(termAPI)

	// Student self-service: view own info
	studentSelfAPI := api.Group("")
	studentSelfAPI.Use(appmw.RequireRole("admin", "teacher", "student"))
	studentSelfAPI.GET("/students/my", h.Student.MyInfo)

	// Enrollments - list for admin/teacher, create/delete for admin/student
	enrListAPI := api.Group("")
	enrListAPI.Use(appmw.RequireRole("admin", "teacher", "student"))
	enrListAPI.GET("/enrollments", h.Enrollment.List)
	enrListAPI.GET("/enrollments/my", h.Enrollment.MyEnrollments)

	enrWriteAPI := api.Group("")
	enrWriteAPI.Use(appmw.RequireRole("admin", "student"))
	enrWriteAPI.POST("/enrollments", h.Enrollment.Create)
	enrWriteAPI.DELETE("/enrollments/:id", h.Enrollment.Delete)

	// Grades - query for all, upsert for admin/teacher
	gradeQueryAPI := api.Group("")
	gradeQueryAPI.Use(appmw.RequireRole("admin", "teacher", "student"))
	gradeQueryAPI.GET("/grades", h.Grade.Query)
	gradeQueryAPI.GET("/grades/my", h.Grade.MyGrades)

	gradeWriteAPI := api.Group("")
	gradeWriteAPI.Use(appmw.RequireRole("admin", "teacher"))
	gradeWriteAPI.PUT("/grades/by-course", h.Grade.UpsertByCourse)
	gradeWriteAPI.PUT("/grades/by-student", h.Grade.UpsertByStudent)

	// Reports (teacher/admin)
	reportAPI := api.Group("")
	reportAPI.Use(appmw.RequireRole("admin", "teacher"))
	h.Report.Register(reportAPI)

	// User management (admin only)
	userAPI := api.Group("")
	userAPI.Use(appmw.RequireRole("admin"))
	h.User.Register(userAPI)
}
