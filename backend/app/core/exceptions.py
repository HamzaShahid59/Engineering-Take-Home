from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.shared.response import error_response


# Converts Pydantic validation errors into the project's
# standard response format.
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    first_error = exc.errors()[0]

    field = None
    location = first_error.get("loc", [])

    if len(location) > 1:
        field = location[-1]

    message = first_error.get("msg", "Validation error")

    if message.startswith("Value error, "):
        message = message.replace("Value error, ", "")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response(
            code="VALIDATION_ERROR",
            message=message,
            field=field,
        ),
    )


# Converts FastAPI HTTPException responses into the
# standard API response structure.
async def http_exception_handler(
    request: Request,
    exc: HTTPException,
):
    code_map = {
        status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
        status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
        status.HTTP_403_FORBIDDEN: "FORBIDDEN",
        status.HTTP_404_NOT_FOUND: "NOT_FOUND",
        status.HTTP_409_CONFLICT: "CONFLICT",
        status.HTTP_422_UNPROCESSABLE_ENTITY: "VALIDATION_ERROR",
    }

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            code=code_map.get(exc.status_code, "HTTP_ERROR"),
            message=str(exc.detail),
        ),
    )


# Handles unexpected application errors and prevents
# internal implementation details from leaking to clients.
async def internal_server_error_handler(
    request: Request,
    exc: Exception,
):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response(
            code="INTERNAL_SERVER_ERROR",
            message="Something went wrong",
        ),
    )