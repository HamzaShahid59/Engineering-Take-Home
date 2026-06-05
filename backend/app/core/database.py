from fastapi import Request
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


# Creates the MongoDB connection once when the app starts.
async def connect_to_mongo(app):
    app.state.mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    app.state.database = app.state.mongo_client[settings.DATABASE_NAME]

    # Ensures email remains unique across all users.
    await app.state.database["users"].create_index("email", unique=True)


# Closes MongoDB connection during application shutdown.
async def close_mongo_connection(app):
    app.state.mongo_client.close()


# Gives routes and services access to the active MongoDB database.
def get_database(request: Request):
    return request.app.state.database