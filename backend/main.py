# main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pymongo import MongoClient, DESCENDING
from pydantic import BaseModel
from sensor_model import *
from typing import List, Optional
from datetime import timedelta
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


class Sensor(BaseModel):
    sensorName: str


class User(BaseModel):
    email: str
    name: str


class Token(BaseModel):
    access_token: str
    token_type: str


# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["issp"]
users_collection = db["users"]
sensor_collection = db["sensor_data"]
project_collection = db["projects"]


def user_helper(user) -> dict:
    return {"id": str(user["_id"]), "email": user["email"], "name": user["name"]}


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