from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field


# Represents uploaded document metadata stored in MongoDB.
class DocumentModel(BaseModel):
    id: Optional[ObjectId] = Field(default=None, alias="_id")

    user_id: ObjectId
    application_id: ObjectId

    original_file_name: str
    file_url: str
    storage_file_id: str
    file_type: str
    file_size: int

    status: str = "to_be_verified"
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )