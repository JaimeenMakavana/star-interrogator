.PHONY: install dev dev-backend dev-frontend lint

install:
	cd backend && python -m pip install -r requirements.txt
	cd frontend && npm install

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev:
	 -j2 dev-backend dev-frontend

lint:
	cd frontend && npm run lint
