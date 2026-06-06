from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


# Handles MongoDB operations for mortgage simulations.
# Business rules stay in the service layer.
class MortgageSimulationRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.collection = database["mortgage_simulations"]

    async def create_simulation(self, simulation_data: dict):
        result = await self.collection.insert_one(simulation_data)
        return await self.find_by_id(result.inserted_id)

    async def find_by_id(self, simulation_id: ObjectId):
        return await self.collection.find_one({"_id": simulation_id})

    async def find_by_id_and_user_id(
        self,
        simulation_id: ObjectId,
        user_id: ObjectId,
    ):
        return await self.collection.find_one(
            {
                "_id": simulation_id,
                "user_id": user_id,
            }
        )

    async def find_by_user_id(self, user_id: ObjectId):
        cursor = self.collection.find(
            {
                "user_id": user_id,
                "status": "locked",
            }
        ).sort("created_at", -1)

        return await cursor.to_list(length=100)

    async def update_simulation(
        self,
        simulation_id: ObjectId,
        user_id: ObjectId,
        simulation_data: dict,
    ):
        await self.collection.update_one(
            {
                "_id": simulation_id,
                "user_id": user_id,
            },
            {
                "$set": simulation_data,
            },
        )

        return await self.find_by_id_and_user_id(
            simulation_id=simulation_id,
            user_id=user_id,
        )

    async def update_office(
        self,
        simulation_id: ObjectId,
        user_id: ObjectId,
        selected_office: dict,
        updated_at,
    ):
        await self.collection.update_one(
            {
                "_id": simulation_id,
                "user_id": user_id,
            },
            {
                "$set": {
                    "selected_office": selected_office,
                    "updated_at": updated_at,
                }
            },
        )

        return await self.find_by_id_and_user_id(
            simulation_id=simulation_id,
            user_id=user_id,
        )

    async def delete_simulation(
        self,
        simulation_id: ObjectId,
        user_id: ObjectId,
    ):
        result = await self.collection.delete_one(
            {
                "_id": simulation_id,
                "user_id": user_id,
            }
        )

        return result.deleted_count

    async def mark_as_converted_to_application(
        self,
        simulation_id: ObjectId,
        user_id: ObjectId,
        application_id: ObjectId,
        updated_at,
    ):
        await self.collection.update_one(
            {
                "_id": simulation_id,
                "user_id": user_id,
            },
            {
                "$set": {
                    "status": "converted to application",
                    "application_id": application_id,
                    "updated_at": updated_at,
                }
            },
        )

        return await self.find_by_id_and_user_id(simulation_id, user_id)