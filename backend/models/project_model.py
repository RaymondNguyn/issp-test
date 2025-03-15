from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from .model import MongoBaseModel

class ProjectInDB(BaseModel):
    project_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    owner_id: str
    sensor_ids: List[str] = []
