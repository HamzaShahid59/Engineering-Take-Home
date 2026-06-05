from datetime import datetime

from pydantic import BaseModel


# Public response shape for uploaded document metadata.
class DocumentResponseSchema(BaseModel):
    id: str
    user_id: str
    application_id: str
    original_file_name: str
    file_url: str
    storage_file_id: str
    file_type: str
    file_size: int
    status: str
    uploaded_at: datetime