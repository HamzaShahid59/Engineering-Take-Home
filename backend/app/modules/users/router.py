from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreateSchema, UserLoginSchema
from app.modules.users.service import UserService
from app.shared.response import success_response

router = APIRouter(
    prefix="/auth", 
    tags=["Auth"]
)


# Creates the user service with its required repository dependency.
# FastAPI calls this automatically for each request.
def get_user_service(
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> UserService:
    user_repository = UserRepository(database)
    return UserService(user_repository)


# Registers a new user and returns JWT token with user details.
@router.post("/register", status_code=201)
async def register_user(
    payload: UserCreateSchema,
    user_service: UserService = Depends(get_user_service),
):
    data = await user_service.register_user(payload)
    return success_response(data)


# Authenticates an existing user and returns a JWT token.
@router.post("/login")
async def login_user(
    payload: UserLoginSchema,
    user_service: UserService = Depends(get_user_service),
):
    data = await user_service.login_user(payload)
    return success_response(data)