from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from sensor_model import SensorData

class Project(BaseModel):
    id: str
    email: str
    project_name: str
    sensors: Optional[List[str]] = []
    created_at: datetime = datetime.now()

    @classmethod
    def from_mongo(cls, document):
        """Convert MongoDB document to Pydantic model."""
        document["id"] = str(document["_id"])
        return cls(**document)