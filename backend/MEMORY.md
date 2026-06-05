# Project Decisions

## Backend

- FastAPI backend.
- MongoDB Atlas database.
- JWT authentication.
- Repository-Service architecture.
- Modular feature-based structure.

## API Standards

Response format:

Success

{
  "success": true,
  "data": {},
  "error": null
}

Failure

{
  "success": false,
  "data": null,
  "error": {
    "code": "",
    "message": "",
    "field": ""
  }
}

## Error Handling

- Validation handled centrally.
- HTTP exceptions handled centrally.
- Internal errors handled centrally.

## Database

- MongoDB ObjectId remains primary key.
- Collections own their indexes.
- Unique constraints enforced at database level.

## Testing

- Tests should be isolated.
- Tests should not depend on execution order.
- Dynamic test data should be generated when uniqueness is required.
- Every endpoint should have positive and negative test coverage.