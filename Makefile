.PHONY: serve stop help

.DEFAULT_GOAL := help

PORT ?= 9999

## serve: Start the development server on port $(PORT)
serve:
	@echo "🌳 Starting World of Joy on http://localhost:$(PORT)"
	@python3 -m http.server $(PORT)

## stop: Stop any running server on port $(PORT)
stop:
	@lsof -ti:$(PORT) | xargs kill -9 2>/dev/null || echo "No server running on port $(PORT)"

## help: Show available commands
help:
	@echo "World of Joy - Fruit Collector Game"
	@echo "===================================="
	@echo ""
	@grep -E '^##' Makefile | sed 's/## //' | column -t -s ':'
	@echo ""
	@echo "Usage: make [command] [PORT=9999]"
