import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# Request schema used when a new user registers.
# It validates user input before the request reaches the service layer.
class UserCreateSchema(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr

    # Optional field. If provided, it must follow Belgian phone number format.
    phone_number: Optional[str] = None

    # Password is limited to 64 characters to stay safely below bcrypt's
    # 72-byte hashing limit.
    password: str = Field(..., min_length=8, max_length=64)

    # Normalizes and validates the user's full name.
    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Full name must be at least 2 characters long")

        return value

    # Validates Belgian phone numbers when a phone number is supplied.
    # Accepted examples:
    # +32471234567
    # 0471234567
    @field_validator("phone_number")
    @classmethod
    def validate_belgian_phone_number(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        value = value.strip().replace(" ", "")

        belgian_phone_pattern = r"^(\+32|0)[1-9][0-9]{7,8}$"

        if not re.match(belgian_phone_pattern, value):
            raise ValueError(
                "Phone number must be a valid Belgian number, e.g. +32471234567 or 0471234567"
            )

        return value

    # Enforces basic password strength rules before hashing.
    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 bytes")

        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter")

        if not any(char.islower() for char in value):
            raise ValueError("Password must contain at least one lowercase letter")

        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one number")

        return value


# Validates login credentials without exposing password hashing details.
class UserLoginSchema(BaseModel):
    email: EmailStr

    # Minimum length is 1 so empty passwords are rejected before service logic.
    password: str = Field(..., min_length=1, max_length=64)

    # Prevents bcrypt runtime errors for passwords exceeding bcrypt's byte limit.
    @field_validator("password")
    @classmethod
    def validate_login_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 bytes")

        return value


# Public user shape returned by authentication endpoints.
class UserResponseSchema(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    is_active: bool


# Token response returned after signup or login.
class TokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponseSchema