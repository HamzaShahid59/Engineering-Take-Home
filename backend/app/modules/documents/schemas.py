from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class DocumentType(str, Enum):
    id_card = "ID Card"
    payslip = "Payslip"
    bank_statement = "Bank Statement"
    employment_business_contract = "Employment/Business Contract"
    property_document = "Property Document"


# Public response shape for uploaded document metadata.
class DocumentResponseSchema(BaseModel):
    id: str
    user_id: str
    application_id: str

    document_type: DocumentType

    original_file_name: str
    file_url: str
    storage_file_id: str
    file_type: str
    file_size: int

    status: str
    uploaded_at: datetime