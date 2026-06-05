from typing import Any, Optional


# Builds a consistent success response for all API endpoints.
def success_response(data: Any = None):
    return {
        "success": True,
        "data": data,
        "error": None,
    }



# Builds a consistent error response for exception handlers and failed requests.
def error_response(
    code: str,
    message: str,
    field: Optional[str] = None,
):
    return {
        "success": False,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "field": field,
        },
    }