from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


# Handles direct MongoDB operations for users.
# Business logic should stay in the service layer,
# not inside this repository.
class UserRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.collection = database["users"]

    # Finds a user by email.
    # Email is used as the unique login identifier.
    async def find_by_email(self, email: str):
        return await self.collection.find_one({"email": email})

    # Finds a user using MongoDB ObjectId.
    async def find_by_id(self, user_id: ObjectId):
        return await self.collection.find_one({"_id": user_id})

    # Creates a new user document and returns the inserted user.
    async def create_user(self, user_data: dict):
        result = await self.collection.insert_one(user_data)
        return await self.find_by_id(result.inserted_id)