from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field


# Represents a saved mortgage simulation document in MongoDB.
# A simulation is created only when the user locks the rate.
class MortgageSimulationModel(BaseModel):
    id: Optional[ObjectId] = Field(default=None, alias="_id")
    user_id: ObjectId

    project_details: dict
    contribution: dict
    financial_details: dict
    personal_details: dict
    calculation_result: dict

    status: str = "locked"
    rate_locked_until: datetime
    selected_office: Optional[dict] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
    )