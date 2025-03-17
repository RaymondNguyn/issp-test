from pydantic import BaseModel, Field
from datetime import datetime
from .model import MongoBaseModel
from typing import Optional, Dict, Any, List

# Flexible vector data model with optional fields
class VectorData(BaseModel):
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None

# Base sensor data model with common fields
class BaseSensorData(BaseModel):
    sensor_id: str  # UUID as string
    timestamp: datetime = Field(default_factory=datetime.now)
    status: Optional[str] = "active"
    # Dynamic data will be stored in the readings field
    readings: Dict[str, Any] = {}

# Sensor definition with metadata about what parameters this sensor reports
class SensorDefinition(BaseModel):
    sensor_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_id: str
    project_ids: str
    asset_ids: str
    alerts: Optional[dict] = None

