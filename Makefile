# =============================================================================
# EduMgr - 教学管理系统 Makefile
# =============================================================================

.PHONY: help dev dev-backend dev-frontend dev-db build build-backend build-frontend \
        up down logs clean migrate seed test

# Default target
.DEFAULT_GOAL := help

# =============================================================================
# Variables
# =============================================================================
DOCKER_COMPOSE = docker compose
BACKEND_DIR = Backend
FRONTEND_DIR = Frontend

# Colors for output
CYAN = \033[0;36m
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

# =============================================================================
# Help
# =============================================================================
help: ## Show this help message
	@echo ""
	@echo "$(CYAN)EduMgr - 教学管理系统$(NC)"
	@echo ""
	@echo "$(GREEN)开发命令:$(NC)"
	@echo "  make dev          - 一键启动本地开发环境（数据库 + 后端 + 前端）"
	@echo "  make dev-db       - 仅启动数据库"
	@echo "  make dev-backend  - 仅启动后端开发服务器"
	@echo "  make dev-frontend - 仅启动前端开发服务器"
	@echo ""
	@echo "$(GREEN)Docker 构建:$(NC)"
	@echo "  make build          - 构建所有 Docker 镜像"
	@echo "  make build-backend  - 仅构建后端镜像"
	@echo "  make build-frontend - 仅构建前端镜像"
	@echo ""
	@echo "$(GREEN)Docker 运行:$(NC)"
	@echo "  make up     - 启动所有 Docker 容器（生产模式）"
	@echo "  make down   - 停止所有 Docker 容器"
	@echo "  make logs   - 查看容器日志"
	@echo ""
	@echo "$(GREEN)数据库:$(NC)"
	@echo "  make migrate      - 运行数据库迁移"
	@echo "  make migrate-down - 回滚数据库迁移"
	@echo "  make seed         - 导入测试数据"
	@echo "  make db-reset     - 重置数据库（危险！）"
	@echo ""
	@echo "$(GREEN)其他:$(NC)"
	@echo "  make clean  - 清理构建产物"
	@echo "  make test   - 运行测试"
	@echo ""

# =============================================================================
# Local Development (一键启动)
# =============================================================================
dev: dev-db ## 一键启动本地开发环境
	@echo "$(CYAN)>>> 等待数据库就绪...$(NC)"
	@sleep 3
	@echo "$(CYAN)>>> 运行数据库迁移...$(NC)"
	@$(MAKE) migrate
	@echo "$(GREEN)>>> 启动后端和前端开发服务器...$(NC)"
	@echo "$(YELLOW)    后端: http://localhost:8080$(NC)"
	@echo "$(YELLOW)    前端: http://localhost:3000$(NC)"
	@echo ""
	@trap 'kill 0' SIGINT; \
	(cd $(BACKEND_DIR) && go run ./cmd/api) & \
	(cd $(FRONTEND_DIR) && pnpm dev) & \
	wait

dev-db: ## 启动数据库容器
	@echo "$(CYAN)>>> 启动 PostgreSQL 数据库...$(NC)"
	@$(DOCKER_COMPOSE) up -d db
	@echo "$(GREEN)>>> 数据库已启动: localhost:5432$(NC)"

dev-backend: ## 启动后端开发服务器
	@echo "$(CYAN)>>> 启动后端开发服务器...$(NC)"
	@cd $(BACKEND_DIR) && go run ./cmd/api

dev-frontend: ## 启动前端开发服务器
	@echo "$(CYAN)>>> 启动前端开发服务器...$(NC)"
	@cd $(FRONTEND_DIR) && pnpm dev

# =============================================================================
# Docker Build
# =============================================================================
build: build-backend build-frontend ## 构建所有 Docker 镜像
	@echo "$(GREEN)>>> 所有镜像构建完成!$(NC)"

build-backend: ## 构建后端 Docker 镜像
	@echo "$(CYAN)>>> 构建后端镜像: edumgr-backend$(NC)"
	@docker build -t edumgr-backend:latest ./$(BACKEND_DIR)
	@echo "$(GREEN)>>> 后端镜像构建完成$(NC)"

build-frontend: ## 构建前端 Docker 镜像
	@echo "$(CYAN)>>> 构建前端镜像: edumgr-frontend$(NC)"
	@docker build -t edumgr-frontend:latest ./$(FRONTEND_DIR)
	@echo "$(GREEN)>>> 前端镜像构建完成$(NC)"

# =============================================================================
# Docker Run
# =============================================================================
up: ## 启动所有 Docker 容器（生产模式）
	@echo "$(CYAN)>>> 启动所有服务...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)>>> 服务已启动:$(NC)"
	@echo "    数据库: localhost:5432"
	@echo "    后端:   http://localhost:8080"
	@echo "    前端:   http://localhost:3000"

down: ## 停止所有 Docker 容器
	@echo "$(CYAN)>>> 停止所有服务...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)>>> 服务已停止$(NC)"

logs: ## 查看容器日志
	@$(DOCKER_COMPOSE) logs -f

logs-backend: ## 查看后端日志
	@$(DOCKER_COMPOSE) logs -f backend

logs-frontend: ## 查看前端日志
	@$(DOCKER_COMPOSE) logs -f frontend

# =============================================================================
# Database
# =============================================================================
migrate: ## 运行数据库迁移
	@echo "$(CYAN)>>> 运行数据库迁移...$(NC)"
	@docker run --rm --network host \
		-v $(PWD)/$(BACKEND_DIR)/migrations:/migrations \
		migrate/migrate \
		-path=/migrations \
		-database "postgres://edumgr:edumgr@localhost:5432/edumgr?sslmode=disable" \
		up
	@echo "$(GREEN)>>> 迁移完成$(NC)"

migrate-down: ## 回滚数据库迁移（最后一个）
	@echo "$(YELLOW)>>> 回滚最后一个迁移...$(NC)"
	@docker run --rm --network host \
		-v $(PWD)/$(BACKEND_DIR)/migrations:/migrations \
		migrate/migrate \
		-path=/migrations \
		-database "postgres://edumgr:edumgr@localhost:5432/edumgr?sslmode=disable" \
		down 1

seed: ## 导入测试数据（需要先运行 migrate）
	@echo "$(CYAN)>>> 导入测试数据...$(NC)"
	@docker run --rm --network host \
		-v $(PWD)/$(BACKEND_DIR)/migrations:/migrations \
		migrate/migrate \
		-path=/migrations \
		-database "postgres://edumgr:edumgr@localhost:5432/edumgr?sslmode=disable" \
		up
	@echo "$(GREEN)>>> 测试数据导入完成$(NC)"

db-reset: ## 重置数据库（危险！会删除所有数据）
	@echo "$(RED)>>> 警告: 即将删除所有数据!$(NC)"
	@read -p "确认要重置数据库吗? [y/N] " confirm && [ "$$confirm" = "y" ]
	@$(DOCKER_COMPOSE) down -v
	@$(DOCKER_COMPOSE) up -d db
	@sleep 3
	@$(MAKE) migrate
	@echo "$(GREEN)>>> 数据库已重置$(NC)"

# =============================================================================
# Clean
# =============================================================================
clean: ## 清理构建产物
	@echo "$(CYAN)>>> 清理构建产物...$(NC)"
	@rm -rf $(BACKEND_DIR)/bin
	@rm -rf $(FRONTEND_DIR)/.next
	@rm -rf $(FRONTEND_DIR)/out
	@echo "$(GREEN)>>> 清理完成$(NC)"

clean-all: clean ## 清理所有（包括 Docker 镜像和数据卷）
	@echo "$(YELLOW)>>> 清理 Docker 资源...$(NC)"
	@$(DOCKER_COMPOSE) down -v --rmi local
	@docker rmi edumgr-backend:latest edumgr-frontend:latest 2>/dev/null || true
	@echo "$(GREEN)>>> 全部清理完成$(NC)"

# =============================================================================
# Test
# =============================================================================
test: ## 运行测试
	@echo "$(CYAN)>>> 运行后端测试...$(NC)"
	@cd $(BACKEND_DIR) && go test ./...
	@echo "$(GREEN)>>> 测试完成$(NC)"

# =============================================================================
# Install Dependencies
# =============================================================================
install: ## 安装所有依赖
	@echo "$(CYAN)>>> 安装后端依赖...$(NC)"
	@cd $(BACKEND_DIR) && go mod download
	@echo "$(CYAN)>>> 安装前端依赖...$(NC)"
	@cd $(FRONTEND_DIR) && pnpm install
	@echo "$(GREEN)>>> 依赖安装完成$(NC)"

# =============================================================================
# Quick Start
# =============================================================================
setup: install dev-db ## 初始化项目（首次使用）
	@sleep 3
	@$(MAKE) migrate
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)  项目初始化完成!$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo ""
	@echo "运行 $(YELLOW)make dev$(NC) 启动开发环境"
	@echo ""
