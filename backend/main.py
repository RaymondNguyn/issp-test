# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pymongo import MongoClient, DESCENDING
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId
import secrets
import smtplib
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from project_model import Project
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from project_model import Project, Asset

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["issp"]
users_collection = db["users"]
sensor_collection = db["sensor_data"]
project_collection = db["projects"]

# Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    sensors: Optional[List[str]] = []
    projects: Optional[List[str]] = []

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class Sensor(BaseModel):
    sensorName: str

class User(BaseModel):
    email: str
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str

class SensorData(BaseModel):
    sensor_id: str
    status: str
    temperature: float
    position: str
    timestamp: datetime
    accelerometer: List[float]
    magnetometer: List[float]
    gyroscope: List[float]

# Helper Functions
def user_helper(user) -> dict:
    return {"id": str(user["_id"]), "email": user["email"], "name": user["name"]}

def generate_reset_token():
    return secrets.token_urlsafe(32)

def send_reset_email(email: str, token: str):
    # Configure your email settings
    sender_email = "your-email@gmail.com"  # Replace with your email
    sender_password = "your-app-password"  # Replace with your app password
    subject = "Password Reset Request"
    body = f"""
    You requested a password reset. Click the link below to reset your password:
    http://localhost:5173/reset-password/{token}
    If you did not request this, please ignore this email.
    """

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, msg.as_string())
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email")

# Routes
@app.post("/api/register", response_model=User)
async def register(user: UserCreate):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already in use")

    hashed_password = get_password_hash(user.password)

    user_dict = user.dict()
    user_dict["password"] = hashed_password

    result = users_collection.insert_one(user_dict)

    return {"id": str(result.inserted_id), "email": user.email, "name": user.name}

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=120)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/user", response_model=User)
async def get_user_name(current_user: str = Depends(get_current_user)):
    user_info = users_collection.find_one({"email": current_user})
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    response = {
        "email": current_user,
        "name": user_info["name"],
        "sensors": user_info.get("sensors", []),
    }
    return response

@app.post("/api/user/add-sensor")
async def add_user_sensor(
    sensor: Sensor, current_user: str = Depends(get_current_user)
):
    user = users_collection.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "sensors" not in user:
        user["sensors"] = []

    if sensor.sensorName in user["sensors"]:
        raise HTTPException(status_code=400, detail="Sensor already added")

    user["sensors"].append(sensor.sensorName)
    users_collection.update_one({"email": current_user}, {"$set": user})

    return {"message": "Sensor added successfully", "sensor": sensor.sensorName}

@app.get("/api/displaySensor", response_model=List[str])
async def display_user_sensors(current_user: str = Depends(get_current_user)):
    user = users_collection.find_one({"email": current_user})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user.get("sensors", [])

@app.post("/api/receive-sensor-data")
async def receive_sensor_data(sensor_data: SensorData):
    data_dict = sensor_data.dict()
    sensor_collection.insert_one(data_dict)
    return {"message": "Data received successfully"}

@app.get("/api/sensors/{sensor_id}")
async def get_sensor_details(
    sensor_id: str, current_user: str = Depends(get_current_user)
):
    sensor_data = list(sensor_collection.find({"sensor_id": sensor_id}))
    if not sensor_data:
        raise HTTPException(status_code=404, detail="Sensor data not found")

    for data in sensor_data:
        data["_id"] = str(data["_id"])

    return sensor_data

@app.get("/api/user/display-sensor-dash")
async def get_latest_sensors(current_user: str = Depends(get_current_user)):
    user = users_collection.find_one({"email": current_user})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sensor_ids = user.get("sensors", [])

    if not sensor_ids:
        return []

    pipeline = [
        {"$match": {"sensor_id": {"$in": sensor_ids}}},
        {"$sort": {"timestamp": DESCENDING}},
        {
            "$group": {
                "_id": "$sensor_id",
                "sensor_id": {"$first": "$sensor_id"},
                "status": {"$first": "$status"},
                "temperature": {"$first": "$temperature"},
                "position": {"$first": "$position"},
                "timestamp": {"$first": "$timestamp"},
                "accelerometer": {"$first": "$accelerometer"},
                "magnetometer": {"$first": "$magnetometer"},
                "gyroscope": {"$first": "$gyroscope"},
            }
        },
        {"$project": {"_id": 0}},
    ]

    latest_sensors = list(sensor_collection.aggregate(pipeline))

    return latest_sensors

# Projects

@app.post("/api/projects", response_model=dict)
async def create_project(project: Project, current_user: str = Depends(get_current_user)):
    try:
        print("Received project data:", project.dict())

        # Set the email and created_at fields
        project.email = current_user
        project.created_at = datetime.now()
        
        # Check if project with same name already exists for this user
        existing_project = project_collection.find_one({"project_name": project.project_name, "email": current_user})
        if existing_project:
            raise HTTPException(status_code=400, detail="Project with this name already exists")

        # Convert the project to a dictionary for MongoDB
        project_dict = project.dict()
        
        # Use the UUID as MongoDB _id
        project_dict["_id"] = project_dict["id"]
        del project_dict["id"]
        
        # Insert the project into the database
        result = project_collection.insert_one(project_dict)

        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to insert project into database")

        return {
            "id": str(result.inserted_id),
            "project_name": project.project_name,
            "description": project.description,
            "date": project.date,
            "email": project.email,
            "sensors": project.sensors,
            "created_at": project.created_at,
        }
    except Exception as e:
        print("Error creating project:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/projects", response_model=List[dict])
async def get_user_projects(current_user: str = Depends(get_current_user)):
    user = users_collection.find_one({"email": current_user})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    projects = list(project_collection.find({"email": current_user}))
    
    if not projects:
        return []  # Return empty list instead of 404 error
    
    formatted_projects = []
    for project in projects:
        formatted_project = {
            "id": str(project["_id"]),
            "project_name": project.get("project_name", "Unnamed Project"),
            "description": project.get("description", ""),
            "date": project.get("date", ""),
            "sensors": project.get("sensors", []),
            "created_at": project.get("created_at", ""),
            "email": project.get("email", ""),
        }
        formatted_projects.append(formatted_project)
    
    return formatted_projects

@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: str = Depends(get_current_user)):
    # Try to find the project by the string ID (UUID)
    project = project_collection.find_one({"_id": project_id, "email": current_user})
    
    # If not found, try with ObjectId for backward compatibility
    if not project:
        try:
            project_object_id = ObjectId(project_id)
            project = project_collection.find_one({"_id": project_object_id, "email": current_user})
        except Exception:
            pass
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project["id"] = str(project["_id"])
    return project

@app.get("/api/projects/{project_id}/assets", response_model=List[dict])
async def get_project_assets(project_id: str, current_user: str = Depends(get_current_user)):
    """Get all assets for a specific project."""
    # Validate project exists and user has access
    project = project_collection.find_one({"_id": project_id, "email": current_user})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    # Get assets from the assets collection
    if "assets" not in db.list_collection_names():
        return []
    
    assets_collection = db["assets"]
    assets = list(assets_collection.find({"project_id": project_id}))
    
    if not assets:
        return []  # Return empty list if no assets found
    
    formatted_assets = []
    for asset in assets:
        formatted_asset = {
            "id": str(asset["_id"]),
            "asset_name": asset.get("name", "Unnamed Asset"),  # Map backend field to frontend expected field
            "description": asset.get("description", ""),
            "type": asset.get("type", "general"),
            "project_id": asset.get("project_id", ""),
            "created_at": asset.get("created_at", ""),
            "email": asset.get("email", "")
        }
        formatted_assets.append(formatted_asset)
    
    return formatted_assets

@app.post("/api/projects/{project_id}/assets", response_model=dict)
async def create_project_asset(
    project_id: str, 
    asset_data: dict,  # Use a dict to accept the frontend data format
    current_user: str = Depends(get_current_user)
):
    # Validate project exists and user has access
    project = project_collection.find_one({"_id": project_id, "email": current_user})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    # Create a new assets collection if it doesn't exist already
    if "assets" not in db.list_collection_names():
        db.create_collection("assets")
    
    assets_collection = db["assets"]
    
    try:
        # Map frontend fields to backend model
        asset = Asset(
            name=asset_data.get("asset_name", "Unnamed Asset"),
            description=asset_data.get("description", ""),
            type="general",  # Default type
            project_id=project_id,
            created_at=datetime.now()
        )
        
        # Convert to dictionary for MongoDB
        asset_dict = asset.dict()
        
        # Use the asset ID as MongoDB _id
        asset_dict["_id"] = asset_dict["id"]
        
        # Add user ownership
        asset_dict["email"] = current_user
        
        # Insert the asset into the database
        result = assets_collection.insert_one(asset_dict)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to insert asset into database")
        
        return {
            "id": str(result.inserted_id),
            "asset_name": asset.name,  # Map back to frontend expected field
            "description": asset.description,
            "type": asset.type,
            "project_id": asset.project_id,
            "created_at": asset.created_at,
            "email": current_user
        }
    except Exception as e:
        print(f"Error creating asset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}/sensors")
async def get_project_sensors(project_id: str, current_user: str = Depends(get_current_user)):
    try:
        project_object_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID")

    project = project_collection.find_one({"_id": project_object_id, "email": current_user})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    sensor_ids = project.get("sensors", [])
    sensors = list(sensor_collection.find({"sensor_id": {"$in": sensor_ids}}))

    for sensor in sensors:
        sensor["_id"] = str(sensor["_id"])

    return sensors


@app.delete("/api/projects/{project_id}", response_model=dict)
async def delete_project(project_id: str, current_user: str = Depends(get_current_user)):
    """Delete a specific project by ID for the current user."""
    from fastapi.responses import JSONResponse
    
    try:
        print(f"Attempting to delete project: {project_id}")
        print(f"Current user: {current_user}")
        
        # Check if project exists - use _id instead of id
        project = project_collection.find_one({"_id": project_id, "email": current_user})
        print(f"Project found: {project is not None}")
        
        if not project:
            # Additional debug - also check using _id
            project_check = project_collection.find_one({"_id": project_id})
            if project_check:
                print(f"Project exists but email mismatch. Project email: {project_check.get('email')}")
            else:
                print(f"No project found with ID: {project_id}")
            
            return JSONResponse(
                status_code=404,
                content={"detail": "Project not found or access denied"}
            )
        
        # Delete the project - use _id instead of id
        result = project_collection.delete_one({"_id": project_id, "email": current_user})
        
        if result.deleted_count == 0:
            return JSONResponse(
                status_code=404,
                content={"detail": "Project not found or already deleted"}
            )
            
        return {
            "message": "Project successfully deleted",
            "deleted_count": result.deleted_count,
            "project_id": project_id
        }
    except Exception as e:
        import traceback
        print(f"Error deleting project {project_id}:", str(e))
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": f"Server error: {str(e)}"}
        )
