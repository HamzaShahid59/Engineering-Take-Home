from fastapi import APIRouter, Depends, File, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user
from app.modules.documents.repository import DocumentRepository
from app.modules.documents.service import DocumentService
from app.modules.mortgage_applications.repository import (
    MortgageApplicationRepository,
)
from app.shared.response import success_response

router = APIRouter(
    prefix="/mortgage-applications",
    tags=["Documents"],
)


# Creates the document service with required repositories.
def get_document_service(
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> DocumentService:
    document_repository = DocumentRepository(database)
    application_repository = MortgageApplicationRepository(database)

    return DocumentService(
        document_repository=document_repository,
        application_repository=application_repository,
    )


# Uploads one supporting document for an owned application.
@router.post("/{application_id}/documents", status_code=201)
async def upload_document(
    application_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    data = await document_service.upload_document(
        application_id=application_id,
        file=file,
        current_user=current_user,
    )

    return success_response(data)


# Returns documents linked to an owned application.
@router.get("/{application_id}/documents")
async def get_application_documents(
    application_id: str,
    current_user: dict = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    data = await document_service.get_application_documents(
        application_id=application_id,
        current_user=current_user,
    )

    return success_response(data)


# Deletes one document from ImageKit and MongoDB.
@router.delete("/{application_id}/documents/{document_id}")
async def delete_document(
    application_id: str,
    document_id: str,
    current_user: dict = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    data = await document_service.delete_document(
        application_id=application_id,
        document_id=document_id,
        current_user=current_user,
    )

    return success_response(data)