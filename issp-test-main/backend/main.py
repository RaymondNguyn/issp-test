# main.py
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pymongo import MongoClient, DESCENDING
from pydantic import BaseModel
from backend.sensor_model import SensorData
from backend.project_model import *
from typing import List, Optional
from datetime import timedelta
from backend.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
import smtplib
import os
from dotenv import load_dotenv
from secrets import token_urlsafe
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["FRONT_URL"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    sensors: Optional[List[str]] = []
    projects: Optional[List[str]] = []


class Sensor(BaseModel):
    sensorName: str


class User(BaseModel):
    email: str
    name: str


class Token(BaseModel):
    access_token: str
    token_type: str

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["issp"]
users_collection = db["users"]
sensor_collection = db["sensor_data"]
project_collection = db["projects"]

# Temporary storage for reset tokens (Use Redis in production)
password_reset_tokens = {}

def user_helper(user) -> dict:
    return {"id": str(user["_id"]), "email": user["email"], "name": user["name"]}

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path, override=True)

EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))

# Email sending function (Update SMTP settings for real email)
def send_reset_email(email: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    # Email Content
    subject = "Reset Your Password"
    body = f"""
    Hello,

    Click the link below to reset your password:
    {reset_link}

    If you did not request this, please ignore this email.

    Regards,
    SETU Technologies
    """

    msg = MIMEMultipart()
    msg["From"] = "SETU Technologies <no-reply@yourapp.com>"
    msg["Reply-To"] = "support@yourapp.com"
    msg["To"] = email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    
    try:
        print(f"Connecting to SMTP server: {SMTP_SERVER}:{SMTP_PORT}")
        print(f"Logging in as: {EMAIL_SENDER}")

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)  # Replace with real SMTP server
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)  # Replace with credentials
        server.sendmail(EMAIL_SENDER, email, msg.as_string())
        server.quit()
        print("Password reset email sent successfully!")
    except Exception as e:
        print("Email sending failed:", e)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # Dynamically use the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["issp"]
users_collection = db["users"]
sensor_collection = db["sensor_data"]
project_collection = db["projects"]

@app.post("/api/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = token_urlsafe(32)  # Generate a secure token
    password_reset_tokens[token] = request.email  # Store temporarily

    # Send email in the background
    background_tasks.add_task(send_reset_email, request.email, token)

    return {"message": "Password reset email sent"}


@app.post("/api/reset-password")
async def reset_password(request: ResetPasswordRequest):
    email = password_reset_tokens.get(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    hashed_password = get_password_hash(request.new_password)
    users_collection.update_one({"email": email}, {"$set": {"password": hashed_password}})

    del password_reset_tokens[request.token]  # Remove token after use

    return {"message": "Password updated successfully"}


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