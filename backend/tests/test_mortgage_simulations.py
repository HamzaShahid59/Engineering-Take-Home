from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.main import app


# Creates a fresh test client for every test case.
# This ensures FastAPI startup and shutdown events
# execute correctly for each test.
@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


# Cleans test-created users and simulations after each test.
# This prevents test data from permanently staying in MongoDB.
@pytest.fixture(autouse=True)
def cleanup_test_data():
    yield

    async def cleanup():
        mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
        database = mongo_client[settings.DATABASE_NAME]

        test_users = await database["users"].find(
            {
                "email": {
                    "$regex": "^simulation\\.user\\."
                }
            },
            {"_id": 1},
        ).to_list(length=None)

        test_user_ids = [user["_id"] for user in test_users]

        if test_user_ids:
            await database["mortgage_simulations"].delete_many(
                {
                    "user_id": {
                        "$in": test_user_ids
                    }
                }
            )

        await database["users"].delete_many(
            {
                "email": {
                    "$regex": "^simulation\\.user\\."
                }
            }
        )

        mongo_client.close()

    import asyncio

    asyncio.run(cleanup())

# Generates a unique email address for each test run
# to avoid duplicate email conflicts in MongoDB.
def unique_email(prefix: str) -> str:
    return f"{prefix}.{uuid4().hex}@example.com"


# Registers a test user and returns a valid auth token.
def create_auth_token(client) -> str:
    payload = {
        "full_name": "Simulation Test User",
        "email": unique_email("simulation.user"),
        "phone_number": "+32471234567",
        "password": "Password123",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 201

    body = response.json()

    return body["data"]["access_token"]


# Builds a valid mortgage simulation request body.
def valid_simulation_payload() -> dict:
    return {
        "project_details": {
            "project_purpose": "Buy property",
            "borrower_type": "Only for myself",
            "property_type": "Home",
            "property_location": "Flanders",
            "property_price": 300000,
            "property_usage": "Living",
            "sale_type": "Private sale",
            "epc_score": 100,
        },
        "contribution": {
            "own_funds": 70000,
        },
        "financial_details": {
            "incomes": [
                {
                    "income_type": "Salary",
                    "monthly_amount": 5800,
                }
            ],
            "liabilities": [],
        },
        "personal_details": {
            "date_of_birth": "2000-11-05",
            "number_of_dependents": 0,
        },
        "preferred_duration_years": 25,
    }


# Verifies all mortgage simulation dropdown options
# are available for the frontend.
def test_get_all_simulation_options(client):
    response = client.get("/mortgage-simulations/options")

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None

    data = body["data"]

    assert "project_purposes" in data
    assert "borrower_types" in data
    assert "property_types" in data
    assert "property_locations" in data
    assert "property_usages" in data
    assert "sale_types" in data
    assert "income_types" in data
    assert "liability_types" in data
    assert "offices" in data


# Verifies office options are available separately
# for the select-office step.
def test_get_office_options(client):
    response = client.get("/mortgage-simulations/options/offices")

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None
    assert len(body["data"]) >= 1
    assert body["data"][0]["office_id"] in ["antwerp", "brussels", "ghent"]


# Verifies mortgage calculation works without saving
# anything to the database.
def test_calculate_mortgage_simulation_success(client):
    payload = valid_simulation_payload()

    response = client.post("/mortgage-simulations/calculate", json=payload)

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None

    data = body["data"]

    assert data["property_price"] == 300000
    assert data["own_funds"] == 70000
    assert data["loan_amount"] == 230000
    assert data["monthly_income"] == 5800
    assert data["monthly_liabilities"] == 0
    assert "monthly_payment" in data
    assert "interest_rate" in data
    assert "feasibility_status" in data


# Verifies invalid simulation input returns
# the standard validation error response.
def test_calculate_mortgage_simulation_invalid_property_price(client):
    payload = valid_simulation_payload()
    payload["project_details"]["property_price"] = 0

    response = client.post("/mortgage-simulations/calculate", json=payload)

    assert response.status_code == 422

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["field"] == "property_price"


# Verifies users must be authenticated before
# saving and locking a mortgage simulation.
def test_save_and_lock_requires_authentication(client):
    payload = valid_simulation_payload()

    response = client.post("/mortgage-simulations/save-and-lock", json=payload)

    assert response.status_code == 401

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "UNAUTHORIZED"


# Verifies a logged-in user can save and lock
# a mortgage simulation for 14 days.
def test_save_and_lock_simulation_success(client):
    token = create_auth_token(client)
    payload = valid_simulation_payload()

    payload["selected_office"] = {
        "office_id": "antwerp",
        "name": "Antwerp Office",
        "city": "Antwerp",
    }

    response = client.post(
        "/mortgage-simulations/save-and-lock",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None

    data = body["data"]

    assert "id" in data
    assert "user_id" in data
    assert data["status"] == "locked"
    assert data["project_details"]["property_price"] == 300000
    assert data["contribution"]["own_funds"] == 70000
    assert data["calculation_result"]["loan_amount"] == 230000
    assert data["selected_office"]["office_id"] == "antwerp"
    assert "rate_locked_until" in data


# Verifies a logged-in user can list their
# saved mortgage simulations.
def test_get_my_simulations_success(client):
    token = create_auth_token(client)
    payload = valid_simulation_payload()

    client.post(
        "/mortgage-simulations/save-and-lock",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    response = client.get(
        "/mortgage-simulations/my-simulations",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 1


# Verifies a logged-in user can update a saved simulation
# and the backend recalculates the mortgage result.
def test_update_simulation_success(client):
    token = create_auth_token(client)
    payload = valid_simulation_payload()

    save_response = client.post(
        "/mortgage-simulations/save-and-lock",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    simulation_id = save_response.json()["data"]["id"]

    update_payload = valid_simulation_payload()
    update_payload["contribution"]["own_funds"] = 100000
    update_payload["preferred_duration_years"] = 30

    response = client.put(
        f"/mortgage-simulations/{simulation_id}",
        json=update_payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None

    data = body["data"]

    assert data["contribution"]["own_funds"] == 100000
    assert data["calculation_result"]["loan_amount"] == 200000
    assert data["calculation_result"]["duration_years"] == 30


# Verifies a logged-in user can update only
# the selected office for a saved simulation.
def test_select_office_success(client):
    token = create_auth_token(client)
    payload = valid_simulation_payload()

    save_response = client.post(
        "/mortgage-simulations/save-and-lock",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    simulation_id = save_response.json()["data"]["id"]

    response = client.patch(
        f"/mortgage-simulations/{simulation_id}/office",
        json={"office_id": "brussels"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["selected_office"]["office_id"] == "brussels"
    assert body["data"]["selected_office"]["name"] == "Brussels Office"


# Verifies invalid office selection is rejected.
def test_select_office_invalid_office(client):
    token = create_auth_token(client)
    payload = valid_simulation_payload()

    save_response = client.post(
        "/mortgage-simulations/save-and-lock",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    simulation_id = save_response.json()["data"]["id"]

    response = client.patch(
        f"/mortgage-simulations/{simulation_id}/office",
        json={"office_id": "invalid-office"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "NOT_FOUND"
    assert body["error"]["message"] == "Office not found"


# Verifies a logged-in user can delete their
# own saved mortgage simulation.
def test_delete_simulation_success(client):
    token = create_auth_token(client)
    payload = valid_simulation_payload()

    save_response = client.post(
        "/mortgage-simulations/save-and-lock",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    simulation_id = save_response.json()["data"]["id"]

    response = client.delete(
        f"/mortgage-simulations/{simulation_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["message"] == "Simulation deleted successfully"
    assert body["data"]["simulation_id"] == simulation_id


# Verifies deleting a non-existing simulation
# returns a not found response.
def test_delete_simulation_not_found(client):
    token = create_auth_token(client)
    fake_simulation_id = "64b7f9f4f4a5f8b1e8c12345"

    response = client.delete(
        f"/mortgage-simulations/{fake_simulation_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404

    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "NOT_FOUND"
    assert body["error"]["message"] == "Simulation not found"