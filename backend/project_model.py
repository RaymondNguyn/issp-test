from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Project(BaseModel):
    project_name: str
    description: Optional[str] = ""
    date: Optional[str] = ""
    sensors: List[str] = []  # List of sensor IDs
    created_at: Optional[datetime] = None
    email: Optional[str] = None

    @classmethod
    def from_mongo(cls, document):
        """Convert MongoDB document to Pydantic model."""
        document["id"] = str(document["_id"])
        return cls(**document)