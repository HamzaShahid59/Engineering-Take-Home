from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.database import get_database
from bson import ObjectId
from app.core.config import settings

# Password hashing configuration.
password_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

bearer_scheme = HTTPBearer()


# Hashes a plain text password before storing it.
def hash_password(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must not exceed 72 bytes")

    return password_context.hash(password)


# Verifies a plain password against a stored hash.
def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    if len(plain_password.encode("utf-8")) > 72:
        return False

    return password_context.verify(
        plain_password,
        hashed_password,
    )


# Creates a JWT access token for authenticated users.
def create_access_token(
    user_id: str,
    email: str,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

# Decodes the JWT token and returns the logged-in user.
# Protected routes use this dependency to access current user data.
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    database=Depends(get_database),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    user = await database["users"].find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    return user