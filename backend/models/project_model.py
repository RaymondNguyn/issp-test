from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional
from .model import MongoBaseModel
import uuid

class ProjectInDB(BaseModel):
    project_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    date: Optional[date]
    owner_id: str
    assets_ids: List[str] = []
    sensor_ids: List[str] = []
