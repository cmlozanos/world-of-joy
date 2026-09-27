# Bundle sync only writes this repository; provide the canonical data directory explicitly.
LEARNING_SOURCE ?=
.PHONY: sync-gates check-gates

sync-gates:
	node tools/sync-learning-gate.mjs --source "$(LEARNING_SOURCE)"

check-gates:
	node tools/sync-learning-gate.mjs --check $(if $(LEARNING_SOURCE),--source "$(LEARNING_SOURCE)")

check: check-gates

.PHONY: run serve stop help check check-browser check-performance measure-render install-tests icons

.DEFAULT_GOAL := help

PORT ?= 9999

## install-tests: Install this project's browser test dependencies
install-tests:
	npm ci
	npx playwright install chromium

## check: Validate educational gate, modules, local offline resources and cache isolation
check:
	node tools/check.cjs

## check-performance: Verify fixed-step physics, batched pickups, culling and resource lifetime
check-performance:
	node tools/check-performance.cjs

## measure-render: Sample Three.js render counters with Android UA, DPR1, normal random world
measure-render:
	WORLD_RENDER_ONLY=1 node tools/check-browser.cjs

## check-browser: Test four modes, touch-check.cjs, long hold/release, pause, gate, home and offline
check-browser:
	node tools/check-browser.cjs

## icons: Rasterize the original SVG icons for Android PWA installation
icons:
	node tools/icons.cjs

## run: Alias of serve
run: serve

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
