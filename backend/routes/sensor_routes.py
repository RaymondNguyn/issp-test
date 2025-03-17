from fastapi import APIRouter, HTTPException, Depends
from services.sensor_service import process_sensor_data, classify_alert
from models.sensor_model import BaseSensorData, SensorDefinition
from database import sensor_data_collection, sensors_collection, users_collection
from datetime import datetime
import uuid
from datetime import datetime
from services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from typing import Dict, Any, List

router = APIRouter(prefix="/sensors", tags=["sensors"])

@router.post("/reading")
async def submit_reading(data: Dict[str, Any]):
    try:
        sensor_data = process_sensor_data(data)
        return {"status": "success", "data": sensor_data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/data")
async def get_sensor_data():
    # Mock data for testing
    return {
        "sensors": [
            {
                "id": "sensor1",
                "temperature": 25.5,
                "accelerometer": {"x": 0.1, "y": 0.2, "z": 0.3}
            }
        ]
    }

@router.post("/api/receive-sensor-data")
async def receive_sensor_data(data: Dict[str, Any]):
    try:
        sensor = sensors_collection.find_one({"sensor_id": data.get("sensor_id")})
        if not sensor:
            raise HTTPException(status_code=404, detail="Sensor not registered")
        
        sensor_id = sensor['sensor_id']
        sensor_data = process_sensor_data(data)
        sensor_data_dict = sensor_data.model_dump() if hasattr(sensor_data, "model_dump") else sensor_data.dict()
        history = list(sensor_data_collection.find({"sensor_id": sensor_id}).sort("timestamp", -1).limit(10))
        alerts = classify_alert(sensor_data_dict, history)
        sensor_data_dict["alerts"] = alerts
        
        # insert data into sensor_data collection
        result = sensor_data_collection.insert_one(sensor_data_dict)
        
        # update sensors to have alert
        sensor_result = sensors_collection.update_one(
            {"sensor_id": sensor_data_dict["sensor_id"]},
            {"$set": {"alerts": alerts}}
        )

        return {
            "message": "Data received successfully",
            "id": str(result.inserted_id),
            "alerts": alerts
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


## Registers sensors Change this to also add sensorID to user
@router.post("/api/add-sensors", response_model=SensorDefinition)
async def register_sensor(
    sensor: Dict[str, Any], 
    current_user: str = Depends(get_current_user)
):
    name = sensor.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Sensor name is required")
    
    sensor_uuid = str(uuid.uuid4())
    
    sensor_definition = SensorDefinition(
        sensor_id=str(sensor_uuid),
        name=name,
        owner_id=current_user,
    )
    
    document_dict = sensor_definition.dict(by_alias=True, exclude_none=True)
    result = sensors_collection.insert_one(document_dict)
    
    created_sensor = sensor_definition.dict()
    created_sensor["_id"] = str(result.inserted_id)
    
    # Add the uuid to the user array
    users_collection.update_one(
        {"email": current_user},
        {"$push": {"sensors": sensor_uuid}}
    )
    
    return SensorDefinition(**created_sensor)

## Get sensors to display
@router.get("/api/sensor-data/{sensor_id}")
async def get_sensor_data(
    sensor_id: str,
    limit: int = 100,
    current_user: str = Depends(get_current_user)
):

    sensor = sensors_collection.find_one({
        "sensor_id": sensor_id,
        "owner_id": current_user
    })
    
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found or you don't have access")
    
    query = {"sensor_id": sensor_id}
    
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
    print(formatted_results)
    return formatted_results

@router.get("/api/sensors", response_model=List[SensorDefinition])
async def list_sensors(current_user: str = Depends(get_current_user)):
    sensors = list(sensors_collection.find({"owner_id": current_user}))
    print(sensors)
    for sensor in sensors:
        if sensor["_id"] is not None:
            sensor["_id"] = str(sensor["_id"])
        else:
            sensor["_id"] = None
    return sensors