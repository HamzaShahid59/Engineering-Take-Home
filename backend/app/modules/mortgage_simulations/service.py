from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Type

from bson import ObjectId
from fastapi import HTTPException, status

from app.modules.mortgage_simulations.calculator import (
    calculate_mortgage_simulation,
)
from app.modules.mortgage_simulations.repository import (
    MortgageSimulationRepository,
)
from app.modules.mortgage_simulations.schemas import (
    BorrowerType,
    IncomeType,
    LiabilityType,
    MortgageSimulationCalculateSchema,
    ProjectPurpose,
    PropertyLocation,
    PropertyType,
    PropertyUsage,
    SaleType,
    SaveAndLockSimulationSchema,
    UpdateMortgageSimulationSchema,
)


OFFICES = [
    {
        "office_id": "antwerp",
        "name": "Antwerp Office",
        "city": "Antwerp",
    },
    {
        "office_id": "brussels",
        "name": "Brussels Office",
        "city": "Brussels",
    },
    {
        "office_id": "ghent",
        "name": "Ghent Office",
        "city": "Ghent",
    },
]


# Handles mortgage simulation business logic.
class MortgageSimulationService:
    def __init__(
        self,
        simulation_repository: MortgageSimulationRepository | None = None,
    ):
        self.simulation_repository = simulation_repository

    async def calculate_simulation(
        self,
        payload: MortgageSimulationCalculateSchema,
    ) -> dict:
        return calculate_mortgage_simulation(payload)

    async def save_and_lock_simulation(
        self,
        payload: SaveAndLockSimulationSchema,
        current_user: dict,
    ) -> dict:
        if self.simulation_repository is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Simulation repository is not configured",
            )

        now = datetime.now(timezone.utc)
        rate_locked_until = now + timedelta(days=14)

        calculation_result = calculate_mortgage_simulation(payload)

        simulation_data = {
            "user_id": current_user["_id"],
            "project_details": payload.project_details.model_dump(mode="json"),
            "contribution": payload.contribution.model_dump(mode="json"),
            "financial_details": payload.financial_details.model_dump(mode="json"),
            "personal_details": payload.personal_details.model_dump(mode="json"),
            "calculation_result": calculation_result,
            "status": "locked",
            "rate_locked_until": rate_locked_until,
            "selected_office": (
                payload.selected_office.model_dump(mode="json")
                if payload.selected_office
                else None
            ),
            "created_at": now,
            "updated_at": now,
        }

        simulation = await self.simulation_repository.create_simulation(
            simulation_data
        )

        return self._serialize_simulation(simulation)

    async def get_my_simulations(
        self,
        current_user: dict,
    ) -> list[dict]:
        if self.simulation_repository is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Simulation repository is not configured",
            )

        simulations = await self.simulation_repository.find_by_user_id(
            current_user["_id"]
        )

        return [
            self._serialize_simulation(simulation)
            for simulation in simulations
        ]

    # Returns one saved simulation owned by the authenticated user.
    async def get_simulation_by_id(
        self, 
        simulation_id: str, 
        current_user: dict
    ) -> dict:
        if self.simulation_repository is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Mortgage simulation repository is not available",
            )

        if not ObjectId.is_valid(simulation_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid simulation id",
            )

        simulation = (
            await self.simulation_repository.find_by_id_and_user_id(
                ObjectId(simulation_id),
                current_user["_id"],
            )
        )

        if not simulation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found",
            )

        return self._serialize_simulation(simulation)


    async def update_simulation(
        self,
        simulation_id: str,
        payload: UpdateMortgageSimulationSchema,
        current_user: dict,
    ) -> dict:
        if self.simulation_repository is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Simulation repository is not configured",
            )

        simulation_object_id = self._to_object_id(simulation_id)

        existing_simulation = await self.simulation_repository.find_by_id_and_user_id(
            simulation_id=simulation_object_id,
            user_id=current_user["_id"],
        )

        if not existing_simulation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found",
            )

        calculation_result = calculate_mortgage_simulation(payload)

        simulation_data = {
            "project_details": payload.project_details.model_dump(mode="json"),
            "contribution": payload.contribution.model_dump(mode="json"),
            "financial_details": payload.financial_details.model_dump(mode="json"),
            "personal_details": payload.personal_details.model_dump(mode="json"),
            "calculation_result": calculation_result,
            "selected_office": (
                payload.selected_office.model_dump(mode="json")
                if payload.selected_office
                else existing_simulation.get("selected_office")
            ),
            "updated_at": datetime.now(timezone.utc),
        }

        updated_simulation = await self.simulation_repository.update_simulation(
            simulation_id=simulation_object_id,
            user_id=current_user["_id"],
            simulation_data=simulation_data,
        )

        return self._serialize_simulation(updated_simulation)

    async def select_office(
        self,
        simulation_id: str,
        office_id: str,
        current_user: dict,
    ) -> dict:
        if self.simulation_repository is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Simulation repository is not configured",
            )

        selected_office = self._find_office_by_id(office_id)

        if selected_office is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Office not found",
            )

        simulation_object_id = self._to_object_id(simulation_id)

        updated_simulation = await self.simulation_repository.update_office(
            simulation_id=simulation_object_id,
            user_id=current_user["_id"],
            selected_office=selected_office,
            updated_at=datetime.now(timezone.utc),
        )

        if not updated_simulation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found",
            )

        return self._serialize_simulation(updated_simulation)

    async def delete_simulation(
        self,
        simulation_id: str,
        current_user: dict,
    ) -> dict:
        if self.simulation_repository is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Simulation repository is not configured",
            )

        simulation_object_id = self._to_object_id(simulation_id)

        deleted_count = await self.simulation_repository.delete_simulation(
            simulation_id=simulation_object_id,
            user_id=current_user["_id"],
        )

        if deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found",
            )

        return {
            "message": "Simulation deleted successfully",
            "simulation_id": simulation_id,
        }

    def get_offices(self) -> list[dict]:
        return OFFICES

    def _find_office_by_id(self, office_id: str) -> dict | None:
        return next(
            (office for office in OFFICES if office["office_id"] == office_id),
            None,
        )

    def _to_object_id(self, value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid simulation id",
            )

    def _serialize_simulation(self, simulation: dict) -> dict:
        return {
            "id": str(simulation["_id"]),
            "user_id": str(simulation["user_id"]),
            "project_details": simulation["project_details"],
            "contribution": simulation["contribution"],
            "financial_details": simulation["financial_details"],
            "personal_details": simulation["personal_details"],
            "calculation_result": simulation["calculation_result"],
            "status": simulation["status"],
            "rate_locked_until": simulation["rate_locked_until"].isoformat(),
            "selected_office": simulation.get("selected_office"),
        }

    # Converts enum values into frontend-friendly dropdown options.
    def _enum_to_options(self, enum_class: Type[Enum]) -> list[dict]:
        return [
            {
                "label": item.value,
                "value": item.value,
            }
            for item in enum_class
        ]

    def get_project_purposes(self) -> list[dict]:
        return self._enum_to_options(ProjectPurpose)

    def get_borrower_types(self) -> list[dict]:
        return self._enum_to_options(BorrowerType)

    def get_property_types(self) -> list[dict]:
        return self._enum_to_options(PropertyType)

    def get_property_locations(self) -> list[dict]:
        return self._enum_to_options(PropertyLocation)

    def get_property_usages(self) -> list[dict]:
        return self._enum_to_options(PropertyUsage)

    def get_sale_types(self) -> list[dict]:
        return self._enum_to_options(SaleType)

    def get_income_types(self) -> list[dict]:
        return self._enum_to_options(IncomeType)

    def get_liability_types(self) -> list[dict]:
        return self._enum_to_options(LiabilityType)

    def get_all_options(self) -> dict:
        return {
            "project_purposes": self.get_project_purposes(),
            "borrower_types": self.get_borrower_types(),
            "property_types": self.get_property_types(),
            "property_locations": self.get_property_locations(),
            "property_usages": self.get_property_usages(),
            "sale_types": self.get_sale_types(),
            "income_types": self.get_income_types(),
            "liability_types": self.get_liability_types(),
            "offices": self.get_offices(),
        }