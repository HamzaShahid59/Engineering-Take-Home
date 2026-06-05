from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Converts MongoDB ObjectId values into strings for API-friendly output.
class UserModel(BaseModel):
    # MongoDB uses "_id" as the primary identifier.
    # In Python code, we expose it as "id" while keeping
    # "_id" as the actual database field.
    id: Optional[ObjectId] = Field(default=None, alias="_id")

    full_name: str

    # Email is the unique identifier for authentication.
    email: EmailStr

    # Phone number is optional, but validated at schema level
    # when supplied during registration.
    phone_number: Optional[str] = None

    # Stores the hashed password only.
    # Plain text passwords must never be saved.
    hashed_password: str

    # Allows disabling users without deleting their records.
    is_active: bool = True

    # Tracks when the user was created.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Tracks the latest update time for the user record.
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
    )