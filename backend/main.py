from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pymongo import MongoClient, DESCENDING
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
from auth import verify_password, get_password_hash, create_access_token, get_current_user
import os

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Classes for request/response models
class Sensor(BaseModel):
    sensorName: str

class SensorData(BaseModel):
    sensor_id: str
    temperature: float
    humidity: float
    timestamp: datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    sensors: Optional[List[str]] = []
    projects: Optional[List[str]] = []
    status: str = "pending"  # New field: pending or approved

class User(BaseModel):
    email: str
    name: str
    status: str

class Token(BaseModel):
    access_token: str
    token_type: str
    is_admin: bool

class Project(BaseModel):
    project_name: str
    sensors: List[str]
    email: str
    created_at: datetime

# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["issp"]
users_collection = db["users"]
sensor_collection = db["sensor_data"]
project_collection = db["projects"]

# Admin emails for authentication
admin_emails = ["test@example.com", "rishi@example.com"]

def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),  # Frontend expects 'id'
        "name": user["name"],
        "email": user["email"],
        "status": user["status"]
    }

@app.post("/api/register", response_model=User)
async def register(user: UserCreate):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already in use")

    # Store password directly since we're not using hashing
    user_dict = user.dict()
    user_dict["status"] = "pending"  # All new users start as pending

    result = users_collection.insert_one(user_dict)
    return {
        "id": str(result.inserted_id),
        "email": user.email,
        "name": user.name,
        "status": "pending"
    }

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is approved
    if user.get("status") != "approved" and form_data.username not in admin_emails:
        raise HTTPException(
            status_code=401,
            detail="Account pending approval",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=120)
    is_admin = form_data.username in admin_emails
    access_token = create_access_token(
        data={
            "sub": form_data.username,
            "admin": is_admin
        },
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": is_admin
    }

@app.get("/api/user", response_model=User)
async def get_user_name(current_user: str = Depends(get_current_user)):
    user_info = users_collection.find_one({"email": current_user})
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    response = {
        "email": current_user,
        "name": user_info["name"],
        "sensors": user_info.get("sensors", []),
        "status": user_info.get("status", "pending")
    }
    print("response", response)
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


## To be removed or integrated with sensors
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
    print(f"fetching sensor data{sensor_data}")
    if not sensor_data:
        raise HTTPException(status_code=404, detail="Sensor data not found")

    for data in sensor_data:
        data["_id"] = str(data["_id"])

    print(sensor_data)
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
        {"$sort": {"timestamp": DESCENDING}},  # Sort by timestamp, newest first
        {
            "$group": {
                "_id": "$sensor_id",  # Group by sensor_id
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
        {"$project": {"_id": 0}},  # Remove MongoDB's default `_id`
    ]

    latest_sensors = list(sensor_collection.aggregate(pipeline))

    return latest_sensors

@app.get("/api/projects", response_model=List[Project])
async def get_user_projects(current_user: str = Depends(get_current_user)):
    # Fetch the user's projects based on their email
    user = users_collection.find_one({"email": current_user})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    projects = list(project_collection.find({"email": current_user}))
    
    if not projects:
        raise HTTPException(status_code=404, detail="No projects found for the user")
    
    # Format project data for response (convert MongoDB _id to string and include sensors)
    formatted_projects = []
    for project in projects:
        formatted_project = {
            "id": str(project["_id"]),
            "project_name": project.get("project_name", "Unnamed Project"),
            "sensors": project.get("sensors", []),  # Make sure this matches what your frontend expects
            "created_at": project.get("created_at", ""),
            "email": project.get("email", "")  # Include email if needed
        }
        formatted_projects.append(formatted_project)
    print(formatted_projects)

    return formatted_projects

@app.post("/api/projects", response_model=dict)
async def create_project(project: Project, current_user: str = Depends(get_current_user)):
    project.email = current_user

    # Check if project name already exists
    existing_project = project_collection.find_one({"project_name": project.project_name})
    if existing_project:
        raise HTTPException(status_code=400, detail="Project with this name already exists")

    # Add project creation timestamp
    project.created_at = datetime.now()

    project_dict = project.dict()
    result = project_collection.insert_one(project_dict)

    return {
        "id": str(result.inserted_id),
        "project_name": project.project_name,
        "email": project.email,
        "sensors": project.sensors,
        "created_at": project.created_at,
    }

# Admin check function
def is_admin(email: str):
    return email in admin_emails

async def get_current_admin(current_user: str = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access admin features"
        )
    return current_user

# Admin endpoints
@app.get("/api/admin/stats")
async def get_admin_stats(current_admin: str = Depends(get_current_admin)):
    total_users = users_collection.count_documents({})
    
    # Get active users (users who have logged in within the last 24 hours)
    one_day_ago = datetime.now() - timedelta(days=1)
    active_users = users_collection.count_documents({
        "last_login": {"$gte": one_day_ago}
    })
    
    # Get total sensor readings
    total_posts = sensor_collection.count_documents({})
    
    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "totalPosts": total_posts
    }

@app.get("/api/admin/recent-activity")
async def get_recent_activity(current_admin: str = Depends(get_current_admin)):
    # Get recent sensor readings
    recent_sensors = list(sensor_collection.find().sort("timestamp", DESCENDING).limit(5))
    
    # Get recent user registrations
    recent_users = list(users_collection.find().sort("_id", DESCENDING).limit(5))
    
    activity = []
    
    # Add sensor activities
    for sensor in recent_sensors:
        activity.append({
            "type": "sensor",
            "description": f"New sensor reading from {sensor['sensor_id']}",
            "timestamp": sensor.get("timestamp", datetime.now()).isoformat()
        })
    
    # Add user activities
    for user in recent_users:
        activity.append({
            "type": "user",
            "description": f"New user registered: {user['email']}",
            "timestamp": user["_id"].generation_time.isoformat()
        })
    
    # Sort combined activities by timestamp
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    return activity[:10]  # Return most recent 10 activities

@app.get("/api/admin/pending-users", response_model=List[dict])
async def get_pending_users(current_admin: str = Depends(get_current_admin)):
    pending_users = []
    for user in users_collection.find({"status": "pending"}):
        pending_users.append(user_helper(user))
    return sorted(pending_users, key=lambda x: x["name"].lower())

@app.get("/api/admin/approved-users", response_model=List[dict])
async def get_approved_users(current_admin: str = Depends(get_current_admin)):
    # Get all approved users except admins
    approved_users = []
    for user in users_collection.find({"status": "approved", "email": {"$nin": admin_emails}}):
        approved_users.append(user_helper(user))
    return sorted(approved_users, key=lambda x: x["name"].lower())

@app.get("/api/admin/user/{user_id}", response_model=User)
async def get_user(user_id: str, current_admin: str = Depends(get_current_admin)):
    from bson import ObjectId
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user_helper(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

@app.put("/api/admin/user/{user_id}", response_model=User)
async def update_user(user_id: str, user_update: User, current_admin: str = Depends(get_current_admin)):
    from bson import ObjectId
    try:
        # Check if user exists
        existing_user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Check if email already exists for another user
        email_user = users_collection.find_one({
            "_id": {"$ne": ObjectId(user_id)},
            "email": user_update.email
        })
        if email_user:
            raise HTTPException(status_code=400, detail="Email already in use by another user")
        
        # Update user
        update_data = {
            "name": user_update.name,
            "email": user_update.email
        }
        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="User not updated")
            
        # Return updated user
        updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
        return user_helper(updated_user)
    except Exception as e:
        if "Invalid user ID format" in str(e):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        raise e

@app.post("/api/admin/approve-user/{user_id}")
async def approve_user(user_id: str, current_admin: str = Depends(get_current_admin)):
    from bson import ObjectId
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": "approved"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User approved successfully"}

@app.post("/api/admin/reject-user/{user_id}")
async def reject_user(user_id: str, current_admin: str = Depends(get_current_admin)):
    from bson import ObjectId
    result = users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User rejected successfully"}

@app.post("/api/admin/delete-user/{user_id}")
async def delete_user(user_id: str, current_admin: str = Depends(get_current_admin)):
    from bson import ObjectId
    result = users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@app.get("/api/admin/user/{user_id}/projects", response_model=List[dict])
async def get_user_projects_admin(user_id: str, current_admin: str = Depends(get_current_admin)):
    from bson import ObjectId
    try:
        # Get user's email
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get user's projects
        projects = list(project_collection.find({"email": user["email"]}))
        
        # Format project data for response
        formatted_projects = []
        for project in projects:
            formatted_project = {
                "id": str(project["_id"]),
                "project_name": project.get("project_name", "Unnamed Project"),
                "sensors": project.get("sensors", []),
                "created_at": project.get("created_at", ""),
                "email": project.get("email", "")
            }
            formatted_projects.append(formatted_project)

        return formatted_projects
    except Exception as e:
        if "Invalid user ID format" in str(e):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        raise HTTPException(status_code=500, detail="Error fetching user projects")