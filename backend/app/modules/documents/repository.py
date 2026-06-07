from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.documents.schemas import DocumentType


# Keeps document MongoDB queries in one place.
class DocumentRepository:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.collection = database["documents"]

    async def create_document(self, document_data: dict):
        result = await self.collection.insert_one(document_data)
        return await self.find_by_id(result.inserted_id)

    async def find_by_id(self, document_id: ObjectId):
        return await self.collection.find_one({"_id": document_id})

    async def find_by_application_and_user(
        self,
        application_id: ObjectId,
        user_id: ObjectId,
    ):
        cursor = self.collection.find(
            {
                "application_id": application_id,
                "user_id": user_id,
            }
        ).sort("uploaded_at", -1)

        return await cursor.to_list(length=None)

    async def find_by_id_application_and_user(
        self,
        document_id: ObjectId,
        application_id: ObjectId,
        user_id: ObjectId,
    ):
        return await self.collection.find_one(
            {
                "_id": document_id,
                "application_id": application_id,
                "user_id": user_id,
            }
        )

    async def delete_document(
        self,
        document_id: ObjectId,
        application_id: ObjectId,
        user_id: ObjectId,
    ):
        return await self.collection.delete_one(
            {
                "_id": document_id,
                "application_id": application_id,
                "user_id": user_id,
            }
        )

    # Returns document types used by the frontend upload form.
    def get_document_types(self):
        return [
            {
                "value": document_type.value,
                "label": document_type.value,
            }
            for document_type in DocumentType
        ]