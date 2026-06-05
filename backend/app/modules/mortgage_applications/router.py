from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user
from app.modules.mortgage_applications.repository import (
    MortgageApplicationRepository,
)
from app.modules.mortgage_applications.schemas import SubmitMortgageApplicationSchema
from app.modules.mortgage_applications.service import MortgageApplicationService
from app.modules.mortgage_simulations.repository import (
    MortgageSimulationRepository,
)
from app.shared.response import success_response

router = APIRouter(
    prefix="/mortgage-applications",
    tags=["Mortgage Applications"],
)


# Creates the application service with required repositories.
def get_mortgage_application_service(
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> MortgageApplicationService:
    application_repository = MortgageApplicationRepository(database)
    simulation_repository = MortgageSimulationRepository(database)

    return MortgageApplicationService(
        application_repository=application_repository,
        simulation_repository=simulation_repository,
    )


# Starts a draft application from an existing locked simulation.
@router.post("/from-simulation/{simulation_id}", status_code=201)
async def create_application_from_simulation(
    simulation_id: str,
    current_user: dict = Depends(get_current_user),
    application_service: MortgageApplicationService = Depends(
        get_mortgage_application_service
    ),
):
    data = await application_service.create_from_simulation(
        simulation_id=simulation_id,
        current_user=current_user,
    )

    return success_response(data)


# Returns all applications for the logged-in user.
@router.get("/my-applications")
async def get_my_applications(
    current_user: dict = Depends(get_current_user),
    application_service: MortgageApplicationService = Depends(
        get_mortgage_application_service
    ),
):
    data = await application_service.get_my_applications(current_user)
    return success_response(data)



# Submits a draft mortgage application.
@router.post("/{application_id}/submit")
async def submit_application(
    application_id: str,
    payload: SubmitMortgageApplicationSchema,
    current_user: dict = Depends(get_current_user),
    application_service: MortgageApplicationService = Depends(
        get_mortgage_application_service
    ),
):
    data = await application_service.submit_application(
        application_id=application_id,
        payload=payload,
        current_user=current_user,
    )

    return success_response(data)

# Returns form config and prefilled snapshot data for a draft application.
@router.get("/{application_id}/form")
async def get_application_form(
    application_id: str,
    current_user: dict = Depends(get_current_user),
    application_service: MortgageApplicationService = Depends(
        get_mortgage_application_service
    ),
):
    data = await application_service.get_application_form(
        application_id=application_id,
        current_user=current_user,
    )

    return success_response(data)

# Returns one application for the logged-in user.
@router.get("/{application_id}")
async def get_application_by_id(
    application_id: str,
    current_user: dict = Depends(get_current_user),
    application_service: MortgageApplicationService = Depends(
        get_mortgage_application_service
    ),
):
    data = await application_service.get_application_by_id(
        application_id=application_id,
        current_user=current_user,
    )

    return success_response(data)

