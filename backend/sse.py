from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
from pymongo import MongoClient
import json

router = APIRouter()

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["issp"]
sensor_collection = db["sensor_data"]

# Async queue to store sensor events
sensor_data_queue = asyncio.Queue()

# Background task to fetch new sensor data from MongoDB
async def monitor_sensor_data():
    while True:
        # Simulate getting new sensor data
        latest_data = sensor_collection.find().sort("timestamp", -1).limit(1)
        for data in latest_data:
            data["_id"] = str(data["_id"])  # Convert MongoDB ObjectID to string
            await sensor_data_queue.put(json.dumps(data))  # Store data in queue
        await asyncio.sleep(2)  # Poll every 2 seconds

# Start background task on startup
@router.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor_sensor_data())

# SSE event stream function
async def event_stream():
    while True:
        event = await sensor_data_queue.get()
        yield f"data: {event}\n\n"

@router.get("/api/notifications")
async def notifications():
    return StreamingResponse(event_stream(), media_type="text/event-stream")
