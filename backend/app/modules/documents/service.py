from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import httpx
from bson import ObjectId
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.modules.documents.repository import DocumentRepository
from app.modules.documents.schemas import DocumentType
from app.modules.mortgage_applications.repository import MortgageApplicationRepository


ALLOWED_FILE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"]
ALLOWED_CONTENT_TYPES = ["application/pdf", "image/png", "image/jpeg"]
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


# Handles document upload, validation, cloud storage, and metadata persistence.
class DocumentService:
    def __init__(
        self,
        document_repository: DocumentRepository,
        application_repository: MortgageApplicationRepository,
    ):
        self.document_repository = document_repository
        self.application_repository = application_repository

    # Uploads a document to ImageKit and stores only metadata in MongoDB.
    async def upload_document(
        self,
        application_id: str,
        document_type: str,
        file: UploadFile,
        current_user: dict,
    ) -> dict:
        application_object_id = self._to_application_object_id(application_id)

        await self._get_owned_application(
            application_object_id=application_object_id,
            current_user=current_user,
        )

        validated_document_type = self._validate_document_type(document_type)

        self._validate_file(file)

        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file cannot be empty",
            )

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must not exceed 5 MB",
            )

        original_file_name = Path(file.filename or "document").name

        imagekit_response = await self._upload_to_imagekit(
            file=file,
            file_bytes=file_bytes,
            application_id=application_id,
            original_file_name=original_file_name,
        )

        now = datetime.now(timezone.utc)

        document_data = {
            "user_id": current_user["_id"],
            "application_id": application_object_id,
            "document_type": validated_document_type,
            "original_file_name": original_file_name,
            "file_url": imagekit_response["url"],
            "storage_file_id": imagekit_response["fileId"],
            "file_type": file.content_type,
            "file_size": len(file_bytes),
            "status": "to_be_verified",
            "uploaded_at": now,
        }

        document = await self.document_repository.create_document(document_data)

        return self._serialize_document(document)

    # Returns document types allowed for uploads.
    def get_document_types(self) -> list:
        return self.document_repository.get_document_types()

    # Returns all documents linked to the user's application.
    async def get_application_documents(
        self,
        application_id: str,
        current_user: dict,
    ) -> list:
        application_object_id = self._to_application_object_id(application_id)

        await self._get_owned_application(
            application_object_id=application_object_id,
            current_user=current_user,
        )

        documents = await self.document_repository.find_by_application_and_user(
            application_id=application_object_id,
            user_id=current_user["_id"],
        )

        return [
            self._serialize_document(document)
            for document in documents
        ]

    # Deletes the file from ImageKit first, then removes MongoDB metadata.
    async def delete_document(
        self,
        application_id: str,
        document_id: str,
        current_user: dict,
    ) -> dict:
        application_object_id = self._to_application_object_id(application_id)
        document_object_id = self._to_document_object_id(document_id)

        await self._get_owned_application(
            application_object_id=application_object_id,
            current_user=current_user,
        )

        document = await self.document_repository.find_by_id_application_and_user(
            document_id=document_object_id,
            application_id=application_object_id,
            user_id=current_user["_id"],
        )

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        await self._delete_from_imagekit(document["storage_file_id"])

        result = await self.document_repository.delete_document(
            document_id=document_object_id,
            application_id=application_object_id,
            user_id=current_user["_id"],
        )

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        return {
            "message": "Document deleted successfully",
        }

    # Confirms the target application belongs to the current user.
    async def _get_owned_application(
        self,
        application_object_id: ObjectId,
        current_user: dict,
    ) -> dict:
        application = await self.application_repository.find_by_id_and_user_id(
            application_id=application_object_id,
            user_id=current_user["_id"],
        )

        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        return application

    # Validates the selected business document type.
    def _validate_document_type(self, document_type: str) -> str:
        for allowed_document_type in DocumentType:
            if document_type == allowed_document_type.value:
                return allowed_document_type.value

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document type",
        )

    # Validates both extension and MIME type before upload.
    def _validate_file(self, file: UploadFile):
        file_extension = Path(file.filename or "").suffix.lower()

        if (
            file_extension not in ALLOWED_FILE_EXTENSIONS
            or file.content_type not in ALLOWED_CONTENT_TYPES
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF, PNG, JPG, and JPEG files are allowed",
            )

    # Sends the file bytes directly from backend to ImageKit.
    async def _upload_to_imagekit(
        self,
        file: UploadFile,
        file_bytes: bytes,
        application_id: str,
        original_file_name: str,
    ) -> dict:

        safe_file_name = f"{uuid4().hex}_{original_file_name}"

        data = {
            "fileName": safe_file_name,
            "folder": f"/mortgage-applications/{application_id}",
        }

        files = {
            "file": (
                file.filename,
                file_bytes,
                file.content_type,
            )
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://upload.imagekit.io/api/v1/files/upload",
                data=data,
                files=files,
                auth=(settings.IMAGEKIT_PRIVATE_KEY, ""),
            )

        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File upload failed",
            )

        return response.json()

    # Removes the uploaded file from ImageKit using its storage id.
    async def _delete_from_imagekit(self, storage_file_id: str):
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.delete(
                f"https://api.imagekit.io/v1/files/{storage_file_id}",
                auth=(settings.IMAGEKIT_PRIVATE_KEY, ""),
            )

        if response.status_code not in [200, 204]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File deletion failed",
            )

    # Converts application id into MongoDB ObjectId safely.
    def _to_application_object_id(self, value: str) -> ObjectId:
        if not ObjectId.is_valid(value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid application id",
            )

        return ObjectId(value)

    # Converts document id into MongoDB ObjectId safely.
    def _to_document_object_id(self, value: str) -> ObjectId:
        if not ObjectId.is_valid(value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid document id",
            )

        return ObjectId(value)

    # Converts MongoDB fields into API-safe response data.
    def _serialize_document(self, document: dict) -> dict:
        return {
            "id": str(document["_id"]),
            "user_id": str(document["user_id"]),
            "application_id": str(document["application_id"]),
            "document_type": document["document_type"],
            "original_file_name": document["original_file_name"],
            "file_url": document["file_url"],
            "storage_file_id": document["storage_file_id"],
            "file_type": document["file_type"],
            "file_size": document["file_size"],
            "status": document["status"],
            "uploaded_at": document["uploaded_at"],
        }