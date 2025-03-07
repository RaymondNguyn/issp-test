# main.py
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pymongo import MongoClient, DESCENDING
from pydantic import BaseModel, EmailStr
from sensor_model import *
from project_model import *
from typing import List, Optional
from datetime import timedelta, datetime
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
import json
from sse import router as sse_router
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from enum import Enum

app = FastAPI()

app.include_router(sse_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class NotificationFrequency(str, Enum):
    INSTANT = "instant"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    OFF = "off"

class NotificationPreferences(BaseModel):
    email: EmailStr
    frequency: NotificationFrequency = NotificationFrequency.INSTANT
    enabled: bool = True
    notify_on_status_change: bool = True
    notify_on_temperature_threshold: bool = True
    temperature_threshold: float = 30.0

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    sensors: Optional[List[str]] = []
    projects: Optional[List[str]] = []
    notification_preferences: Optional[NotificationPreferences] = None

class User(BaseModel):
    email: str
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Sensor(BaseModel):
    sensorName: str

# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["issp"]
users_collection = db["users"]
sensor_collection = db["sensor_data"]
project_collection = db["projects"]

def user_helper(user) -> dict:
    return {"id": str(user["_id"]), "email": user["email"], "name": user["name"]}

# Email configuration
email_conf = ConnectionConfig(
    MAIL_USERNAME="your-email@gmail.com",
    MAIL_PASSWORD="your-app-password",
    MAIL_FROM="your-email@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

fastmail = FastMail(email_conf)

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

@app.put("/api/user/notification-preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: str = Depends(get_current_user)
):
    result = users_collection.update_one(
        {"email": current_user},
        {"$set": {"notification_preferences": preferences.dict()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Notification preferences updated successfully"}

@app.get("/api/user/notification-preferences", response_model=NotificationPreferences)
async def get_notification_preferences(current_user: str = Depends(get_current_user)):
    user = users_collection.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    preferences = user.get("notification_preferences")
    if not preferences:
        # Return default preferences if none set
        return NotificationPreferences(email=current_user)
    
    return NotificationPreferences(**preferences)

async def send_email_notification(background_tasks: BackgroundTasks, to_email: str, subject: str, message: str):
    message = MessageSchema(
        subject=subject,
        recipients=[to_email],
        body=message,
        subtype="html"
    )
    
    background_tasks.add_task(fastmail.send_message, message)

@app.post("/api/receive-sensor-data")
async def receive_sensor_data(
    sensor_data: SensorData,
    background_tasks: BackgroundTasks
):
    data_dict = sensor_data.dict()
    sensor_collection.insert_one(data_dict)
    
    # Find users who have this sensor
    users = users_collection.find({"sensors": sensor_data.sensor_id})
    
    for user in users:
        prefs = user.get("notification_preferences")
        if not prefs or not prefs.get("enabled", True):
            continue
            
        frequency = prefs.get("frequency", "instant")
        if frequency == NotificationFrequency.OFF:
            continue
            
        # Check notification conditions
        should_notify = False
        notification_message = ""
        
        if prefs.get("notify_on_status_change", True) and sensor_data.status != "normal":
            should_notify = True
            notification_message += f"Status Alert: Sensor {sensor_data.sensor_id} status is {sensor_data.status}. "
            
        if (prefs.get("notify_on_temperature_threshold", True) and 
            sensor_data.temperature > prefs.get("temperature_threshold", 30.0)):
            should_notify = True
            notification_message += f"Temperature Alert: {sensor_data.temperature}°C exceeds threshold. "
        
        if should_notify and frequency == NotificationFrequency.INSTANT:
            await send_email_notification(
                background_tasks,
                user["email"],
                f"Sensor Alert - {sensor_data.sensor_id}",
                notification_message
            )
    
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

def create_notification(sensor_id: str, message: str):
    notification_data = {
        "sensor_id": sensor_id,
        "message": message,
        "timestamp": datetime.now()
    }
    # Insert the notification into MongoDB
    notifications_collection = db["notifications"]
    notifications_collection.insert_one(notification_data)

@app.get("/api/notifications")
async def get_notifications(current_user: str = Depends(get_current_user)):
    notifications_collection = db["notifications"]
    notifications = list(notifications_collection.find({"email": current_user}))
    if not notifications:
        raise HTTPException(status_code=404, detail="No notifications found")

    # Format notification data
    formatted_notifications = []
    for notification in notifications:
        formatted_notifications.append({
            "sensor_id": notification.get("sensor_id"),
            "message": notification.get("message"),
            "timestamp": notification.get("timestamp")
        })
    
    return formatted_notifications

# SSE Notifications Endpoint
async def event_stream():
    while True:
        await asyncio.sleep(5)  # Simulating a new notification every 5 seconds
        data = json.dumps({
            "message": "New sensor alert! High temperature detected.",
            "url": "/sensors/123"
        })
        yield f"data: {data}\n\n"

@app.get("/sse/notifications")
async def sse_notifications():
    return StreamingResponse(event_stream(), media_type="text/event-stream")

# Scheduled task to handle non-instant notifications
async def process_scheduled_notifications():
    while True:
        current_time = datetime.utcnow()
        
        # Find users with non-instant notification preferences
        users = users_collection.find({
            "notification_preferences.enabled": True,
            "notification_preferences.frequency": {"$ne": "instant"}
        })
        
        for user in users:
            prefs = user.get("notification_preferences", {})
            frequency = prefs.get("frequency")
            
            # Calculate time window based on frequency
            if frequency == NotificationFrequency.HOURLY:
                time_window = timedelta(hours=1)
            elif frequency == NotificationFrequency.DAILY:
                time_window = timedelta(days=1)
            elif frequency == NotificationFrequency.WEEKLY:
                time_window = timedelta(weeks=1)
            else:
                continue
                
            # Get sensor data within time window
            sensor_data = sensor_collection.find({
                "sensor_id": {"$in": user.get("sensors", [])},
                "timestamp": {"$gte": current_time - time_window}
            })
            
            # Process and send digest email
            # Implementation details here...
        
        # Sleep until next check
        await asyncio.sleep(60 * 15)  # Check every 15 minutes

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_scheduled_notifications())