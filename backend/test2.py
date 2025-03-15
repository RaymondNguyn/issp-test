from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid
from bson import ObjectId

# Custom field for handling MongoDB ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# Base model with ID field
class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, uuid.UUID: str}

# Flexible vector data model with optional fields
class VectorData(BaseModel):
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None

# Base sensor data model with common fields
class BaseSensorData(MongoBaseModel):
    sensor_id: str  # UUID as string
    timestamp: datetime = Field(default_factory=datetime.now)
    status: Optional[str] = "active"
    # Dynamic data will be stored in the readings field
    readings: Dict[str, Any] = {}

# Sensor definition with metadata about what parameters this sensor reports
class SensorDefinition(MongoBaseModel):
    sensor_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    type: str
    owner_id: str
    project_ids: List[str] = []
    # List of parameters this sensor supports
    supported_parameters: List[str] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

# User models remain the same
class UserBase(BaseModel):
    email: EmailStr = Field(unique=True, index=True)
    name: str

class UserCreate(UserBase):
    password: str
    
class UserInDB(UserBase, MongoBaseModel):
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

# Project model remains largely the same
class ProjectInDB(MongoBaseModel):
    project_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    owner_id: str
    sensor_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

# Function to handle flexible sensor data
def process_sensor_data(data: Dict[str, Any]) -> BaseSensorData:
    """
    Process raw sensor data and create a BaseSensorData object.
    Only include fields that are present in the input data.
    """
    # Required fields
    if "sensor_id" not in data:
        raise ValueError("sensor_id is required")
    
    # Create base sensor data
    sensor_data = BaseSensorData(
        sensor_id=data.pop("sensor_id"),
        timestamp=data.pop("timestamp", datetime.now()),
        status=data.pop("status", "active"),
        readings={}
    )
    
    # Process common scalar readings
    scalar_fields = ["adc", "temperature", "roll", "pitch", "position"]
    for field in scalar_fields:
        if field in data:
            sensor_data.readings[field] = data.pop(field)
    
    # Process vector readings
    vector_fields = ["accelerometer", "magnetometer", "gyroscope"]
    for field in vector_fields:
        if field in data:
            vector_data = data.pop(field)
            # Handle vector data in various formats
            if isinstance(vector_data, dict):
                sensor_data.readings[field] = {
                    "x": vector_data.get("x"),
                    "y": vector_data.get("y"),
                    "z": vector_data.get("z")
                }
            elif isinstance(vector_data, list) and len(vector_data) >= 3:
                sensor_data.readings[field] = {
                    "x": vector_data[0],
                    "y": vector_data[1],
                    "z": vector_data[2]
                }
    
    # Add any remaining fields to readings
    for key, value in data.items():
        sensor_data.readings[key] = value
    
    return sensor_data

# Database setup with flexible schema support
def setup_mongodb():
    from pymongo import MongoClient, ASCENDING, DESCENDING
    
    client = MongoClient("mongodb://localhost:27017/")
    db = client["issp"]
    
    # Create collections with flexible schema
    if "users" not in db.list_collection_names():
        db.create_collection("users")
        db.users.create_index([("email", ASCENDING)], unique=True)
    
    if "sensors" not in db.list_collection_names():
        db.create_collection("sensors")
        db.sensors.create_index([("sensor_id", ASCENDING)], unique=True)
        db.sensors.create_index([("owner_id", ASCENDING)])
        db.sensors.create_index([("project_ids", ASCENDING)])
    
    if "sensor_data" not in db.list_collection_names():
        db.create_collection("sensor_data")
        # Index on sensor_id and timestamp for efficient queries
        db.sensor_data.create_index([("sensor_id", ASCENDING), ("timestamp", DESCENDING)])
        # Add indexes for common query patterns
        db.sensor_data.create_index([("readings.temperature", ASCENDING)])
        db.sensor_data.create_index([("readings.position", ASCENDING)])
        db.sensor_data.create_index([("readings.adc", ASCENDING)])
    
    if "projects" not in db.list_collection_names():
        db.create_collection("projects")
        db.projects.create_index([("project_id", ASCENDING)], unique=True)
        db.projects.create_index([("owner_id", ASCENDING)])
        db.projects.create_index([("name", ASCENDING), ("owner_id", ASCENDING)])
    
    return {
        "client": client,
        "db": db,
        "users": db["users"],
        "sensors": db["sensors"],
        "sensor_data": db["sensor_data"],
        "projects": db["projects"]
    }

mongodb = setup_mongodb()
db = mongodb["db"]
users_collection = mongodb["users"]
sensors_collection = mongodb["sensors"] 
sensor_data_collection = mongodb["sensor_data"]
projects_collection = mongodb["projects"]

# Endpoint for receiving flexible sensor data
@app.post("/api/receive-sensor-data")
async def receive_sensor_data(data: Dict[str, Any]):
    try:
        # Validate the sensor exists
        sensor = sensors_collection.find_one({"sensor_id": data.get("sensor_id")})
        if not sensor:
            raise HTTPException(status_code=404, detail="Sensor not registered")
        
        # Process the flexible data
        sensor_data = process_sensor_data(data)
        
        # Insert into database
        result = sensor_data_collection.insert_one(sensor_data.dict(by_alias=True))
        
        return {"message": "Data received successfully", "id": str(result.inserted_id)}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Register a new sensor with its supported parameters
@app.post("/api/sensors", response_model=SensorDefinition)
async def register_sensor(
    sensor: Dict[str, Any], 
    current_user: str = Depends(get_current_user)
):
    # Extract basic sensor info
    name = sensor.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Sensor name is required")
    
    sensor_type = sensor.get("type", "generic")
    description = sensor.get("description", "")
    
    # Extract supported parameters
    supported_parameters = sensor.get("supported_parameters", [])
    
    # Create sensor definition
    sensor_definition = SensorDefinition(
        sensor_id=str(uuid.uuid4()),
        name=name,
        description=description,
        type=sensor_type,
        owner_id=current_user,
        supported_parameters=supported_parameters,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        metadata=sensor.get("metadata", {})
    )
    
    # Insert into database
    result = sensors_collection.insert_one(sensor_definition.dict(by_alias=True))
    
    created_sensor = sensor_definition.dict()
    created_sensor["_id"] = result.inserted_id
    
    return SensorDefinition(**created_sensor)

# Get the latest reading for each sensor in a project
@app.get("/api/projects/{project_id}/latest-readings")
async def get_project_latest_readings(
    project_id: str,
    current_user: str = Depends(get_current_user)
):
    # Verify project exists and user has access
    project = projects_collection.find_one({
        "project_id": project_id,
        "owner_id": current_user
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or you don't have access")
    
    # Get all sensors in this project
    sensor_ids = project.get("sensor_ids", [])
    
    if not sensor_ids:
        return []
    
    # Get latest reading for each sensor
    pipeline = [
        {"$match": {"sensor_id": {"$in": sensor_ids}}},
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": "$sensor_id",
            "sensor_id": {"$first": "$sensor_id"},
            "status": {"$first": "$status"},
            "timestamp": {"$first": "$timestamp"},
            "readings": {"$first": "$readings"}
        }},
        {"$project": {"_id": 0}}
    ]
    
    latest_readings = list(sensor_data_collection.aggregate(pipeline))
    
    # Add sensor metadata to each reading
    enhanced_readings = []
    for reading in latest_readings:
        sensor = sensors_collection.find_one({"sensor_id": reading["sensor_id"]})
        if sensor:
            reading["sensor_name"] = sensor.get("name", "Unknown")
            reading["sensor_type"] = sensor.get("type", "generic")
        enhanced_readings.append(reading)
    
    return enhanced_readings

# Query sensor data with flexible parameters
@app.get("/api/sensor-data/{sensor_id}")
async def get_sensor_data(
    sensor_id: str,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    parameter: Optional[str] = None,
    limit: int = 100,
    current_user: str = Depends(get_current_user)
):
    # Verify sensor exists and user has access
    sensor = sensors_collection.find_one({
        "sensor_id": sensor_id,
        "owner_id": current_user
    })
    
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found or you don't have access")
    
    # Build query filter
    query = {"sensor_id": sensor_id}
    
    if start_time and end_time:
        query["timestamp"] = {"$gte": start_time, "$lte": end_time}
    elif start_time:
        query["timestamp"] = {"$gte": start_time}
    elif end_time:
        query["timestamp"] = {"$lte": end_time}
    
    # Add parameter filter if specified
    if parameter:
        query[f"readings.{parameter}"] = {"$exists": True}
    
    # Execute query
    results = list(sensor_data_collection.find(
        query, 
        sort=[("timestamp", -1)],
        limit=limit
    ))
    
    # Format results
    formatted_results = []
    for result in results:
        result["_id"] = str(result["_id"])
        formatted_results.append(result)
    
    return formatted_results