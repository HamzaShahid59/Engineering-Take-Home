from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user
from app.modules.mortgage_simulations.repository import (
    MortgageSimulationRepository,
)
from app.modules.mortgage_simulations.schemas import (
    MortgageSimulationCalculateSchema,
    SaveAndLockSimulationSchema,
    SelectOfficeSchema,
    UpdateMortgageSimulationSchema,
)
from app.modules.mortgage_simulations.service import MortgageSimulationService
from app.shared.response import success_response

router = APIRouter(
    prefix="/mortgage-simulations",
    tags=["Mortgage Simulations"],
)


# Creates the mortgage simulation service with repository dependency.
def get_mortgage_simulation_service(
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> MortgageSimulationService:
    simulation_repository = MortgageSimulationRepository(database)
    return MortgageSimulationService(simulation_repository)


# -------- Options --------

@router.get("/options")
async def get_all_simulation_options(
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    data = simulation_service.get_all_options()
    return success_response(data)


@router.get("/options/offices")
async def get_offices(
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    return success_response(simulation_service.get_offices())


@router.get("/options/project-purposes")
async def get_project_purposes(
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    return success_response(simulation_service.get_project_purposes())


@router.get("/options/property-types")
async def get_property_types(
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    return success_response(simulation_service.get_property_types())


@router.get("/options/property-locations")
async def get_property_locations(
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    return success_response(simulation_service.get_property_locations())


@router.get("/options/property-usages")
async def get_property_usages(
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    return success_response(simulation_service.get_property_usages())


@router.get("/options/sale-types")
async def get_sale_types(
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    return success_response(simulation_service.get_sale_types())


@router.get("/options/income-types")
async def get_income_types(
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    return success_response(simulation_service.get_income_types())


@router.get("/options/liability-types")
async def get_liability_types(
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    return success_response(simulation_service.get_liability_types())


# -------- Simulation --------

@router.post("/calculate")
async def calculate_mortgage_simulation(
    payload: MortgageSimulationCalculateSchema,
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    data = await simulation_service.calculate_simulation(payload)
    return success_response(data)


@router.post("/save-and-lock", status_code=201)
async def save_and_lock_simulation(
    payload: SaveAndLockSimulationSchema,
    current_user: dict = Depends(get_current_user),
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    data = await simulation_service.save_and_lock_simulation(
        payload=payload,
        current_user=current_user,
    )
    return success_response(data)


@router.get("/my-simulations")
async def get_my_simulations(
    current_user: dict = Depends(get_current_user),
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    data = await simulation_service.get_my_simulations(current_user)
    return success_response(data)

# Returns one saved simulation for the logged-in user.
@router.get("/{simulation_id}")
async def get_simulation_by_id(
    simulation_id: str,
    current_user: dict = Depends(get_current_user),
    mortgage_simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    data = await mortgage_simulation_service.get_simulation_by_id(
        simulation_id,
        current_user,
    )

    return success_response(data)


# Updates a saved simulation owned by the logged-in user.
@router.put("/{simulation_id}")
async def update_simulation(
    simulation_id: str,
    payload: UpdateMortgageSimulationSchema,
    current_user: dict = Depends(get_current_user),
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    data = await simulation_service.update_simulation(
        simulation_id=simulation_id,
        payload=payload,
        current_user=current_user,
    )
    return success_response(data)


@router.patch("/{simulation_id}/office")
async def select_office(
    simulation_id: str,
    payload: SelectOfficeSchema,
    current_user: dict = Depends(get_current_user),
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    data = await simulation_service.select_office(
        simulation_id=simulation_id,
        office_id=payload.office_id,
        current_user=current_user,
    )
    return success_response(data)


@router.delete("/{simulation_id}")
async def delete_simulation(
    simulation_id: str,
    current_user: dict = Depends(get_current_user),
    simulation_service: MortgageSimulationService = Depends(
        get_mortgage_simulation_service
    ),
):
    data = await simulation_service.delete_simulation(
        simulation_id=simulation_id,
        current_user=current_user,
    )
    return success_response(data)