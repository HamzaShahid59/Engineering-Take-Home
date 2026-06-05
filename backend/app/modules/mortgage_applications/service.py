from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status

from app.modules.mortgage_applications.repository import (
    MortgageApplicationRepository,
)
from app.modules.mortgage_applications.schemas import SubmitMortgageApplicationSchema
from app.modules.mortgage_simulations.repository import (
    MortgageSimulationRepository,
)
from app.modules.mortgage_applications.form_schema import (
    get_application_form_schema,
)


# Contains mortgage application business logic.
class MortgageApplicationService:
    def __init__(
        self,
        application_repository: MortgageApplicationRepository,
        simulation_repository: MortgageSimulationRepository,
    ):
        self.application_repository = application_repository
        self.simulation_repository = simulation_repository

    # Creates a draft application from an owned locked simulation.
    async def create_from_simulation(
        self,
        simulation_id: str,
        current_user: dict,
    ) -> dict:
        simulation_object_id = self._to_simulation_object_id(simulation_id)

        simulation = await self.simulation_repository.find_by_id_and_user_id(
            simulation_id=simulation_object_id,
            user_id=current_user["_id"],
        )

        if not simulation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found",
            )

        if simulation.get("status") != "locked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only locked simulations can be used to create an application",
            )

        existing_application = (
            await self.application_repository.find_by_simulation_id_and_user_id(
                simulation_id=simulation_object_id,
                user_id=current_user["_id"],
            )
        )

        if existing_application:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Application already exists for this simulation",
            )

        now = datetime.now(timezone.utc)

        # Simulation data is copied once so the application keeps its own snapshot.
        simulation_snapshot = {
            "project_details": simulation["project_details"],
            "contribution": simulation["contribution"],
            "financial_details": simulation["financial_details"],
            "personal_details": simulation["personal_details"],
            "calculation_result": simulation["calculation_result"],
            "selected_office": simulation.get("selected_office"),
        }

        application_data = {
            "user_id": current_user["_id"],
            "simulation_id": simulation["_id"],
            "status": "draft",
            "simulation_snapshot": simulation_snapshot,
            "application_details": None,
            "created_at": now,
            "updated_at": now,
            "submitted_at": None,
        }

        application = await self.application_repository.create_application(
            application_data
        )

        # Mark the simulation so it cannot silently be reused as a fresh quote.
        await self.simulation_repository.mark_as_converted_to_application(
            simulation_id=simulation["_id"],
            user_id=current_user["_id"],
            application_id=application["_id"],
            updated_at=datetime.now(timezone.utc),
        )

        return self._serialize_application(application)

    # Returns all applications owned by the authenticated user.
    async def get_my_applications(self, current_user: dict) -> list:
        applications = await self.application_repository.find_by_user_id(
            current_user["_id"]
        )

        return [
            self._serialize_application(application)
            for application in applications
        ]

    # Returns one application only if it belongs to the authenticated user.
    async def get_application_by_id(
        self,
        application_id: str,
        current_user: dict,
    ) -> dict:
        application_object_id = self._to_application_object_id(application_id)

        application = await self.application_repository.find_by_id_and_user_id(
            application_id=application_object_id,
            user_id=current_user["_id"],
        )

        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        return self._serialize_application(application)

    # Submits a draft application with final borrower-provided details.
    async def submit_application(
        self,
        application_id: str,
        payload: SubmitMortgageApplicationSchema,
        current_user: dict,
    ) -> dict:
        application_object_id = self._to_application_object_id(application_id)

        application = await self.application_repository.find_by_id_and_user_id(
            application_id=application_object_id,
            user_id=current_user["_id"],
        )

        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        if application.get("status") != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application is already submitted",
            )

        now = datetime.now(timezone.utc)

        # Only application details are updated; simulation snapshot stays unchanged.
        application_data = {
            "application_details": payload.application_details.model_dump(mode="json"),
            "status": "submitted",
            "submitted_at": now,
            "updated_at": now,
        }

        updated_application = await self.application_repository.submit_application(
            application_id=application_object_id,
            user_id=current_user["_id"],
            application_data=application_data,
        )

        return self._serialize_application(updated_application)

    # Converts simulation id into MongoDB ObjectId safely.
    def _to_simulation_object_id(self, value: str) -> ObjectId:
        if not ObjectId.is_valid(value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid simulation id",
            )

        return ObjectId(value)

    # Converts application id into MongoDB ObjectId safely.
    def _to_application_object_id(self, value: str) -> ObjectId:
        if not ObjectId.is_valid(value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid application id",
            )

        return ObjectId(value)

    # Converts MongoDB fields into API-safe response data.
    def _serialize_application(self, application: dict) -> dict:
        return {
            "id": str(application["_id"]),
            "user_id": str(application["user_id"]),
            "simulation_id": str(application["simulation_id"]),
            "status": application["status"],
            "simulation_snapshot": application["simulation_snapshot"],
            "application_details": application.get("application_details"),
            "created_at": application["created_at"],
            "updated_at": application["updated_at"],
            "submitted_at": application.get("submitted_at"),
        }

    # Returns dynamic form config and prefilled snapshot data.
    async def get_application_form(
        self,
        application_id: str,
        current_user: dict,
    ) -> dict:
        application_object_id = self._to_application_object_id(application_id)

        application = await self.application_repository.find_by_id_and_user_id(
            application_id=application_object_id,
            user_id=current_user["_id"],
        )

        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        return {
            "application_id": str(application["_id"]),
            "status": application["status"],
            "prefilled_data": application["simulation_snapshot"],
            "field_schema": get_application_form_schema(),
        }
