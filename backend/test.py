from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
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

# Sensor data models
class VectorData(BaseModel):
    x: float
    y: float
    z: float

class SensorData(MongoBaseModel):
    sensor_id: str  # UUID as string
    adc: int
    position: str
    roll: float
    pitch: float
    accelerometer: VectorData
    magnetometer: VectorData
    gyroscope: VectorData
    temperature: float
    timestamp: datetime = Field(default_factory=datetime.now)
    status: Optional[str] = "active"

# Sensor definition (metadata)
class SensorDefinition(MongoBaseModel):
    sensor_id: str = Field(default_factory=lambda: str(uuid.uuid4()))  # UUID for unique identification
    name: str  # Can be duplicate (not a unique key)
    description: Optional[str] = None
    type: str
    owner_id: str  # User's email who owns this sensor
    project_ids: List[str] = []  # Projects this sensor is associated with
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}  # For any additional sensor-specific data

# User models
class UserBase(BaseModel):
    email: EmailStr = Field(unique=True, index=True)
    name: str

class UserCreate(UserBase):
    password: str
    
class UserInDB(UserBase, MongoBaseModel):
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

class UserResponse(UserBase, MongoBaseModel):
    pass

# Project models
class ProjectBase(BaseModel):
    name: str  # Can be duplicate across users
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectInDB(ProjectBase, MongoBaseModel):
    project_id: str = Field(default_factory=lambda: str(uuid.uuid4()))  # UUID for unique identification
    owner_id: str  # User's email who created this project
    sensor_ids: List[str] = []  # Sensors belonging to this project
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}  # For any additional project-specific data

class ProjectResponse(ProjectBase, MongoBaseModel):
    project_id: str
    owner_id: str
    sensor_ids: List[str] = []
    created_at: datetime

# Database setup with appropriate indexes
def setup_mongodb():
    from pymongo import MongoClient, ASCENDING, DESCENDING
    
    client = MongoClient("mongodb://localhost:27017/")
    db = client["issp"]
    
    # Create collections with indexes
    if "users" not in db.list_collection_names():
        db.create_collection("users")
        db.users.create_index([("email", ASCENDING)], unique=True)
    
    if "sensors" not in db.list_collection_names():
        db.create_collection("sensors")
        db.sensors.create_index([("sensor_id", ASCENDING)], unique=True)
        db.sensors.create_index([("owner_id", ASCENDING)])  # For finding user's sensors
        db.sensors.create_index([("project_ids", ASCENDING)])  # For finding project's sensors
    
    if "sensor_data" not in db.list_collection_names():
        db.create_collection("sensor_data")
        db.sensor_data.create_index([("sensor_id", ASCENDING), ("timestamp", DESCENDING)])
    
    if "projects" not in db.list_collection_names():
        db.create_collection("projects")
        db.projects.create_index([("project_id", ASCENDING)], unique=True)
        db.projects.create_index([("owner_id", ASCENDING)])  # For finding user's projects
        db.projects.create_index([("name", ASCENDING), ("owner_id", ASCENDING)])  # For checking duplicates per user
    
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

# Example API endpoints with the new structure

# Register a sensor (allows duplicate names)
@app.post("/api/sensors", response_model=SensorDefinition)
async def register_sensor(
    sensor: SensorDefinition, 
    current_user: str = Depends(get_current_user)
):
    # Set the owner to current user
    sensor.owner_id = current_user
    sensor.sensor_id = str(uuid.uuid4())  # Generate UUID
    sensor.created_at = datetime.now()
    sensor.updated_at = datetime.now()
    
    # Insert the sensor
    result = sensors_collection.insert_one(sensor.dict(by_alias=True))
    
    created_sensor = sensor.dict()
    created_sensor["_id"] = result.inserted_id
    
    return SensorDefinition(**created_sensor)

# Create a project (allows duplicate names across users)
@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate, 
    current_user: str = Depends(get_current_user)
):
    # Check if project with same name exists for this user
    existing_project = projects_collection.find_one({
        "name": project.name,
        "owner_id": current_user
    })
    
    if existing_project:
        raise HTTPException(
            status_code=400, 
            detail="You already have a project with this name"
        )
    
    project_id = str(uuid.uuid4())
    project_in_db = ProjectInDB(
        **project.dict(),
        project_id=project_id,
        owner_id=current_user,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    result = projects_collection.insert_one(project_in_db.dict(by_alias=True))
    
    created_project = ProjectResponse(
        id=result.inserted_id,
        project_id=project_id,
        **project.dict(),
        owner_id=current_user,
        sensor_ids=[],
        created_at=project_in_db.created_at
    )
    
    return created_project

# Add a sensor to a project
@app.post("/api/projects/{project_id}/add-sensor/{sensor_id}")
async def add_sensor_to_project(
    project_id: str,
    sensor_id: str,
    current_user: str = Depends(get_current_user)
):
    # Check if project exists and user owns it
    project = projects_collection.find_one({
        "project_id": project_id,
        "owner_id": current_user
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or you don't have access")
    
    # Check if sensor exists and user owns it
    sensor = sensors_collection.find_one({
        "sensor_id": sensor_id,
        "owner_id": current_user
    })
    
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found or you don't have access")
    
    # Add sensor to project
    projects_collection.update_one(
        {"project_id": project_id},
        {
            "$addToSet": {"sensor_ids": sensor_id},
            "$set": {"updated_at": datetime.now()}
        }
    )
    
    # Add project to sensor's projects list
    sensors_collection.update_one(
        {"sensor_id": sensor_id},
        {
            "$addToSet": {"project_ids": project_id},
            "$set": {"updated_at": datetime.now()}
        }
    )
    
    return {"status": "success", "message": "Sensor added to project successfully"}

# Get all sensors owned by the current user
@app.get("/api/sensors", response_model=List[SensorDefinition])
async def get_user_sensors(current_user: str = Depends(get_current_user)):
    sensors = list(sensors_collection.find({"owner_id": current_user}))
    return [SensorDefinition(**sensor) for sensor in sensors]

# Get all projects owned by the current user
@app.get("/api/projects", response_model=List[ProjectResponse])
async def get_user_projects(current_user: str = Depends(get_current_user)):
    projects = list(projects_collection.find({"owner_id": current_user}))
    return [ProjectResponse(**project) for project in projects]

# Get all sensors associated with a project
@app.get("/api/projects/{project_id}/sensors", response_model=List[SensorDefinition])
async def get_project_sensors(
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
    sensors = list(sensors_collection.find({"project_ids": project_id}))
    return [SensorDefinition(**sensor) for sensor in sensors]