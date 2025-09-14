# Document Repository Docker Management

# Default environment file
ENV_FILE ?= .env

# Colors for output
GREEN = \033[32m
YELLOW = \033[33m
BLUE = \033[34m
RED = \033[31m
NC = \033[0m # No Color

.PHONY: help build up down logs clean dev-up dev-down prod-up prod-down setup

help: ## Show this help message
	@echo "$(BLUE)Document Repository Docker Commands$(NC)"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

setup: ## Create .env file from example
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from .env.example...$(NC)"; \
		cp .env.example .env; \
		echo "$(GREEN)Please edit .env file with your configuration$(NC)"; \
	else \
		echo "$(YELLOW).env file already exists$(NC)"; \
	fi

build: ## Build all Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose --env-file $(ENV_FILE) build

dev-up: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose --env-file $(ENV_FILE) -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8088"
	@echo "Database: localhost:5432"

dev-down: ## Stop development environment
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker-compose --env-file $(ENV_FILE) -f docker-compose.dev.yml down

dev-logs: ## Show development logs
	docker-compose --env-file $(ENV_FILE) -f docker-compose.dev.yml logs -f

prod-up: ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker-compose --env-file $(ENV_FILE) up -d
	@echo "$(GREEN)Production environment started!$(NC)"
	@echo "Application: http://localhost"
	@echo "Backend API: http://localhost:8088"

prod-down: ## Stop production environment
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	docker-compose --env-file $(ENV_FILE) down

prod-logs: ## Show production logs
	docker-compose --env-file $(ENV_FILE) logs -f

up: dev-up ## Alias for dev-up

down: dev-down ## Alias for dev-down

logs: dev-logs ## Show logs (development)

restart: ## Restart services
	@echo "$(YELLOW)Restarting services...$(NC)"
	docker-compose --env-file $(ENV_FILE) restart

rebuild: ## Rebuild and restart
	@echo "$(BLUE)Rebuilding and restarting...$(NC)"
	docker-compose --env-file $(ENV_FILE) down
	docker-compose --env-file $(ENV_FILE) build --no-cache
	docker-compose --env-file $(ENV_FILE) up -d

clean: ## Clean up containers, networks, and volumes
	@echo "$(RED)Cleaning up Docker resources...$(NC)"
	docker-compose --env-file $(ENV_FILE) down -v --remove-orphans
	docker-compose --env-file $(ENV_FILE) -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f

clean-all: ## Clean everything including images
	@echo "$(RED)Cleaning up all Docker resources including images...$(NC)"
	docker-compose --env-file $(ENV_FILE) down -v --remove-orphans --rmi all
	docker-compose --env-file $(ENV_FILE) -f docker-compose.dev.yml down -v --remove-orphans --rmi all
	docker system prune -af

status: ## Show service status
	@echo "$(BLUE)Service Status:$(NC)"
	docker-compose --env-file $(ENV_FILE) ps

db-shell: ## Access PostgreSQL shell
	docker exec -it docrepo_postgres_dev psql -U docrepo_user -d document_repository

backend-shell: ## Access backend container shell
	docker exec -it docrepo_backend_dev sh

frontend-shell: ## Access frontend container shell
	docker exec -it docrepo_frontend_dev sh

install: setup build ## Initial setup and build

init: install dev-up ## Complete initialization (setup, build, and start)
