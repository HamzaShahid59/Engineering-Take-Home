# Testing Skill

Testing Principles

- Tests must be independent.
- Tests must not depend on order.
- Success and failure paths should both be tested.
- Validation tests should verify response structure.
- Integration tests may use MongoDB.

Naming

test_create_x_success
test_create_x_validation_error
test_create_x_conflict
test_create_x_not_found

Recommended Coverage

- Happy path
- Validation failure
- Duplicate data
- Unauthorized access
- Forbidden access
- Resource not found
- Internal failure if applicable

Assertions

Always verify:

status code

success flag

data payload

error payload