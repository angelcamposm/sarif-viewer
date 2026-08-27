# ==============================================================================
# SARIF Security Report Viewer - Makefile
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

IMAGE_NAME ?= sarif-viewer
IMAGE_TAG  ?= latest
PORT       ?= 8080

# ------------------------------------------------------------------------------
# Help / Target Index
# ------------------------------------------------------------------------------
.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "SARIF Security Report Viewer - Available Make Targets:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ------------------------------------------------------------------------------
# Dependency Management
# ------------------------------------------------------------------------------
.PHONY: install
install: ## Install npm dependencies cleanly (npm ci)
	npm ci

# ------------------------------------------------------------------------------
# Development & Testing
# ------------------------------------------------------------------------------
.PHONY: dev
dev: ## Start Vite local development server
	npm run dev

.PHONY: build
build: ## Compile production web bundle into dist/
	npm run build

.PHONY: preview
preview: build ## Preview the production build locally via Vite
	npm run preview

.PHONY: lint
lint: ## Run code linter (oxlint)
	npm run lint

.PHONY: test
test: ## Run unit tests suite (vitest)
	npm run test

.PHONY: typecheck
typecheck: ## Run TypeScript compiler typecheck without emitting files
	npm run typecheck

.PHONY: verify
verify: lint test typecheck build ## Run full verification pipeline (lint, test, typecheck, build)
	@echo "All verification checks passed successfully!"

# ------------------------------------------------------------------------------
# Cleaning
# ------------------------------------------------------------------------------
.PHONY: clean
clean: ## Clean build artifacts (dist/ and coverage/)
	rm -rf dist coverage .nyc_output *.zip

.PHONY: clean-all
clean-all: clean ## Clean build artifacts and node_modules
	rm -rf node_modules

# ------------------------------------------------------------------------------
# Docker Operations (Rootless Container on Port 8080)
# ------------------------------------------------------------------------------
.PHONY: docker-build
docker-build: ## Build the rootless production Docker image
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

.PHONY: docker-run
docker-run: ## Run the rootless Docker container locally on http://localhost:$(PORT)
	docker run --rm -p $(PORT):8080 --name $(IMAGE_NAME) $(IMAGE_NAME):$(IMAGE_TAG)

.PHONY: docker-compose-up
docker-compose-up: ## Start the service in the background using docker-compose
	docker compose up --build -d

.PHONY: docker-compose-down
docker-compose-down: ## Stop and remove docker-compose containers
	docker compose down

.PHONY: docker-compose-logs
docker-compose-logs: ## Follow docker-compose logs
	docker compose logs -f
