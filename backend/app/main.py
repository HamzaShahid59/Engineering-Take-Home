from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError

from app.core.database import close_mongo_connection, connect_to_mongo
from app.core.exceptions import (
    http_exception_handler,
    internal_server_error_handler,
    validation_exception_handler,
)
from app.modules.users.router import router as users_router
from app.modules.mortgage_simulations.router import (
    router as mortgage_simulations_router,
)
from app.modules.mortgage_applications.router import (
    router as mortgage_applications_router,
)
from app.modules.documents.router import router as documents_router

from app.shared.response import success_response


# Handles application startup and shutdown logic.
# MongoDB connection is created when the FastAPI app starts
# and closed safely when the app stops.
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo(app)
    yield
    await close_mongo_connection(app)


app = FastAPI(
    title="Oper Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# Converts FastAPI validation errors into the project's
# standard API response format.
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Converts manually raised HTTPException errors into the
# standard API response format.
app.add_exception_handler(HTTPException, http_exception_handler)

# Catches unexpected server errors and prevents raw internal
# error details from being exposed to API consumers.
app.add_exception_handler(Exception, internal_server_error_handler)

# Registers all API routes.
app.include_router(users_router)
app.include_router(mortgage_simulations_router)
app.include_router(mortgage_applications_router)
app.include_router(documents_router)

# Simple endpoint used to verify that the API is running.
@app.get("/health")
async def health_check():
    return success_response({"status": "healthy"})