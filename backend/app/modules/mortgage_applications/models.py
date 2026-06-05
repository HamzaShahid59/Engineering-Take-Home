from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field

from app.modules.mortgage_applications.schemas import (
    ApplicationDetailsSchema,
    SimulationSnapshotSchema,
)


# Represents a mortgage application document stored in MongoDB.
class MortgageApplicationModel(BaseModel):
    # MongoDB stores this as _id, but the API can expose it as id.
    id: Optional[ObjectId] = Field(default=None, alias="_id")

    # Links the application to the authenticated borrower.
    user_id: ObjectId

    # Keeps a trace back to the saved simulation used to start the application.
    simulation_id: ObjectId

    status: str = "draft"

    # Snapshot remains unchanged after the application is created.
    simulation_snapshot: SimulationSnapshotSchema

    # Filled when the borrower submits the application.
    application_details: Optional[ApplicationDetailsSchema] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    submitted_at: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )