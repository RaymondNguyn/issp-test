from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class Project(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    project_name: str
    description: Optional[str] = ""
    date: Optional[str] = ""
    sensors: List[str] = []  # List of sensor IDs
    created_at: Optional[datetime] = None
    email: Optional[str] = None

    @classmethod
    def from_mongo(cls, document):
        """Convert MongoDB document to Pydantic model."""
        if "_id" in document:
            document["id"] = str(document["_id"])
        return cls(**document)
    
class Asset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    type: str  # e.g., "image", "document", "video"
    project_id: str
    file_path: Optional[str] = None
    created_at: Optional[datetime] = None