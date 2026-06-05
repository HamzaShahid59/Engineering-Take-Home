from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


# Keeps mortgage application MongoDB queries in one place.
class MortgageApplicationRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.collection = database["mortgage_applications"]

    async def create_application(self, application_data: dict):
        result = await self.collection.insert_one(application_data)
        return await self.find_by_id(result.inserted_id)

    async def find_by_id(self, application_id: ObjectId):
        return await self.collection.find_one({"_id": application_id})

    async def find_by_simulation_id_and_user_id(
        self,
        simulation_id: ObjectId,
        user_id: ObjectId,
    ):
        return await self.collection.find_one(
            {
                "simulation_id": simulation_id,
                "user_id": user_id,
            }
        )

    async def find_by_user_id(self, user_id: ObjectId):
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        return await cursor.to_list(length=None)

    async def find_by_id_and_user_id(
        self,
        application_id: ObjectId,
        user_id: ObjectId,
    ):
        return await self.collection.find_one(
            {
                "_id": application_id,
                "user_id": user_id,
            }
        )

    async def submit_application(
        self,
        application_id: ObjectId,
        user_id: ObjectId,
        application_data: dict,
    ):
        await self.collection.update_one(
            {
                "_id": application_id,
                "user_id": user_id,
            },
            {
                "$set": application_data,
            },
        )

        return await self.find_by_id_and_user_id(application_id, user_id)