.PHONY: build up down logs restart clean dev

# Docker compose commands
build:
	docker-compose build

up:
	docker-compose up -d

up-build:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

# Clean up
clean:
	docker-compose down -v --rmi local

# Development
dev:
	npm run dev

# Full rebuild
rebuild: clean up-build
