# Grounded Resume — Development Commands

.PHONY: install-backend install-frontend dev-backend dev-frontend \
        test-backend test-backend-cov lint-backend typecheck-backend \
        test-frontend build-frontend test-e2e verify clean

# Virtual environment
VENV := .venv
VENV_PIP := $(VENV)/bin/pip
VENV_PYTHON := $(VENV)/bin/python

VENV_SENTINEL := $(VENV)/.sentinel

$(VENV_SENTINEL):
	python3 -m venv $(VENV)
	$(VENV_PIP) install --upgrade pip
	touch $(VENV_SENTINEL)

# Install
install-backend: $(VENV_SENTINEL)
	$(VENV_PIP) install -e ".[dev]"

install-frontend:
	cd frontend && npm install

install: install-backend install-frontend

# Dev servers
dev-backend:
	$(VENV_PYTHON) -m grounded_resume

dev-frontend:
	cd frontend && npm run dev

# Backend tests
test-backend:
	$(VENV_PYTHON) -m pytest tests/ -q

test-backend-cov:
	$(VENV_PYTHON) -m pytest tests/ -q --cov=grounded_resume --cov-report=term-missing

# Backend lint / type
lint-backend:
	$(VENV)/bin/ruff check src/ tests/
	$(VENV)/bin/ruff format --check src/ tests/

typecheck-backend:
	$(VENV)/bin/basedpyright src/grounded_resume

# Frontend
build-frontend:
	cd frontend && npm run build

test-frontend:
	cd frontend && npm run test:e2e

# E2E
test-e2e:
	cd frontend && npx playwright test

test-e2e-headed:
	cd frontend && npx playwright test --headed

test-e2e-debug:
	cd frontend && npx playwright test --debug

# Playwright browsers
playwright-install:
	cd frontend && npx playwright install

# Full verification
verify: lint-backend typecheck-backend test-backend build-frontend test-e2e
	@echo "✅ All checks passed"

# Clean generated files
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf .pytest_cache/ .ruff_cache/ .basedpyright/ htmlcov/
	rm -rf frontend/.next/ frontend/dist/
	rm -rf test-results/ playwright-report/
