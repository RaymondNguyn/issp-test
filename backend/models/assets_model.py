from pydantic import BaseModel, Field
from datetime import datetime
from .model import MongoBaseModel
from typing import Optional, Dict, Any, List
import uuid


class BaseAssetData(BaseModel):
    asset_id: str  # UUID as string
    timestamp: datetime = Field(default_factory=datetime.now)


# Sensor definition with metadata about what parameters this sensor reports
class AssetDefinition(BaseModel):
    asset_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_id: str
    project_id: str
    sensor_ids: List[str] = []
    description: Optional[str] = []
    date: datetime