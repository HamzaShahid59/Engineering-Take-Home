from datetime import datetime, timezone

from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import create_access_token, hash_password, verify_password
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreateSchema, UserLoginSchema


# Contains user-related business logic.
# The service layer decides what should happen,
# while the repository only performs database operations.
class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    # Registers a new user, hashes their password,
    # stores the user in MongoDB, and returns a JWT token.
    async def register_user(
        self,
        payload: UserCreateSchema
        ) -> dict:
        # Email is normalized because it is used as the unique identifier.
        email = payload.email.lower().strip()

        existing_user = await self.user_repository.find_by_email(email)

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )

        now = datetime.now(timezone.utc)

        # Password hashing is isolated here so plain text passwords
        # are never stored in the database.
        try:
            hashed_password = hash_password(payload.password)
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(error),
            )

        user_data = {
            "full_name": payload.full_name.strip(),
            "email": email,
            "phone_number": payload.phone_number,
            "hashed_password": hashed_password,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        # DuplicateKeyError protects against race conditions where two
        # registration requests with the same email arrive at the same time.
        try:
            user = await self.user_repository.create_user(user_data)
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )

        access_token = create_access_token(
            user_id=str(user["_id"]),
            email=user["email"],
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user["_id"]),
                "full_name": user["full_name"],
                "email": user["email"],
                "phone_number": user.get("phone_number"),
                "is_active": user["is_active"],
            },
        }

    # Authenticates a user with email and password,
    # then returns a JWT token when credentials are valid.
    async def login_user(
        self, 
        payload: UserLoginSchema
        ) -> dict:
        email = payload.email.lower().strip()

        user = await self.user_repository.find_by_email(email)

        # Keep the error generic to avoid revealing whether
        # a specific email exists in the system.
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not verify_password(payload.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Inactive users cannot log in even if credentials are correct.
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        access_token = create_access_token(
            user_id=str(user["_id"]),
            email=user["email"],
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user["_id"]),
                "full_name": user["full_name"],
                "email": user["email"],
                "phone_number": user.get("phone_number"),
                "is_active": user["is_active"],
            },
        }