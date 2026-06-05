# Oper Borrower Portal Backend

FastAPI backend for a borrower mortgage portal using MongoDB Atlas, JWT authentication, and modular architecture.

## Commands

Run API

uvicorn app.main:app --reload

Run Tests

pytest -v

Run Single Test File

pytest tests/test_auth.py -v

Freeze Dependencies

pip freeze > requirements.txt

## Architecture

Follow modular architecture:

app/
├── core/
├── shared/
├── modules/
│   └── feature/
│       ├── router.py
│       ├── service.py
│       ├── repository.py
│       ├── schemas.py
│       └── models.py

Responsibilities:

- Router handles HTTP layer only.
- Service handles business logic.
- Repository handles database operations only.
- Schemas handle validation.
- Models represent database documents.

## Rules

- Use dependency injection.
- Keep business logic out of routers.
- Keep database logic out of services when possible.
- Use centralized exception handling.
- Use standardized API responses.
- Use MongoDB ObjectId as primary key.
- Add meaningful comments explaining WHY code exists.
- Write tests for both success and failure scenarios.

## Caveats

- MongoDB Atlas is the primary database.
- JWT is the authentication mechanism.
- All API responses must follow success/data/error format.