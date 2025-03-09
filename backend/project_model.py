from pydantic import BaseModel
from datetime import datetime
from typing import List

class Project(BaseModel):
    project_name: str
    email: str
    description: str
    date: str
    sensors: List[str] = []
    created_at: datetime = None

    @classmethod
    def from_mongo(cls, document):
        """Convert MongoDB document to Pydantic model."""
        document["id"] = str(document["_id"])
        return cls(**document)