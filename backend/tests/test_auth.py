from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app


# Creates a fresh test client for every test case.
# This ensures FastAPI startup and shutdown events
# execute correctly for each test.
@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


# Generates a unique email address for each test run
# to avoid duplicate email conflicts in MongoDB.
def unique_email(prefix: str) -> str:
    return f"{prefix}.{uuid4().hex}@example.com"


# Verifies the application health endpoint is available
# and returns the expected response structure.
def test_health_check(client):
    response = client.get("/health")

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["status"] == "healthy"


# Verifies a user can register successfully when
# all required fields are provided.
def test_register_user_success(client):
    payload = {
        "full_name": "Test User",
        "email": unique_email("test.auth"),
        "phone_number": "+32471234567",
        "password": "Password123",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 201

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None

    data = body["data"]

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == payload["email"]
    assert data["user"]["full_name"] == payload["full_name"]
    assert data["user"]["phone_number"] == payload["phone_number"]
    assert data["user"]["is_active"] is True
    assert "id" in data["user"]


# Verifies registration succeeds when phone number
# is not supplied because the field is optional.
def test_register_without_phone_number(client):
    payload = {
        "full_name": "No Phone User",
        "email": unique_email("no.phone"),
        "password": "Password123",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 201

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["user"]["phone_number"] is None


# Verifies duplicate email registration attempts
# are rejected by the system.
def test_register_duplicate_email(client):
    email = unique_email("duplicate")

    payload = {
        "full_name": "Duplicate User",
        "email": email,
        "phone_number": "0471234567",
        "password": "Password123",
    }

    first_response = client.post("/auth/register", json=payload)
    second_response = client.post("/auth/register", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 409

    body = second_response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "CONFLICT"
    assert body["error"]["message"] == "User with this email already exists"


# Verifies only valid Belgian phone numbers
# are accepted during registration.
def test_register_invalid_phone_number(client):
    payload = {
        "full_name": "Invalid Phone",
        "email": unique_email("invalid.phone"),
        "phone_number": "+923001234567",
        "password": "Password123",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 422

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["field"] == "phone_number"


# Verifies password validation requires
# at least one uppercase character.
def test_register_weak_password_no_uppercase(client):
    payload = {
        "full_name": "Weak Password",
        "email": unique_email("weak.password"),
        "phone_number": "+32471234567",
        "password": "password123",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 422

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["field"] == "password"


# Verifies password validation requires
# at least one numeric character.
def test_register_weak_password_no_number(client):
    payload = {
        "full_name": "Weak Password Two",
        "email": unique_email("weak.password.two"),
        "phone_number": "+32471234567",
        "password": "Password",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 422

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["field"] == "password"


# Verifies email format validation
# rejects malformed email addresses.
def test_register_invalid_email(client):
    payload = {
        "full_name": "Invalid Email",
        "email": "wrong-email",
        "phone_number": "+32471234567",
        "password": "Password123",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 422

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["field"] == "email"


# Verifies a registered user can authenticate
# successfully and receive a JWT token.
def test_login_success(client):
    email = unique_email("login.user")

    register_payload = {
        "full_name": "Login User",
        "email": email,
        "phone_number": "+32471234567",
        "password": "Password123",
    }

    client.post("/auth/register", json=register_payload)

    login_payload = {
        "email": email,
        "password": "Password123",
    }

    response = client.post("/auth/login", json=login_payload)

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None

    data = body["data"]

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email


# Verifies authentication fails when
# an incorrect password is supplied.
def test_login_wrong_password(client):
    email = unique_email("wrong.password")

    register_payload = {
        "full_name": "Wrong Password User",
        "email": email,
        "phone_number": "+32471234567",
        "password": "Password123",
    }

    client.post("/auth/register", json=register_payload)

    login_payload = {
        "email": email,
        "password": "WrongPassword123",
    }

    response = client.post("/auth/login", json=login_payload)

    assert response.status_code == 401

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "UNAUTHORIZED"
    assert body["error"]["message"] == "Invalid credentials"


# Verifies authentication fails when
# attempting to log in with a non-existent account.
def test_login_non_existing_user(client):
    payload = {
        "email": unique_email("not.exists"),
        "password": "Password123",
    }

    response = client.post("/auth/login", json=payload)

    assert response.status_code == 401

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "UNAUTHORIZED"
    assert body["error"]["message"] == "Invalid credentials"