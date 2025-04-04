from fastapi import APIRouter, HTTPException, Depends
from services.sensor_service import process_sensor_data, classify_alert
from models.sensor_model import BaseSensorData, SensorDefinition
from database import sensor_data_collection, sensors_collection, users_collection, assets_collection, projects_collection, notification_collection
from datetime import datetime
import uuid
from models.notification_model import Notification
from services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from typing import Dict, Any, List

router = APIRouter()

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
        
        # Create notifications for alerts
        if alerts:
            for field, status in alerts.items():
                if isinstance(status, dict):
                    # Handle nested alerts (e.g., accelerometer with x,y,z)
                    for sub_field, sub_status in status.items():
                        if sub_status in ['warning', 'danger']:
                            notification = Notification(
                                notification_id=str(uuid.uuid4()),
                                user_id=sensor['owner_id'],
                                sensor_id=sensor_id,
                                message=f"{sub_status.upper()}: Abnormal {field}.{sub_field} reading for sensor {sensor['name']}",
                                alert_type=sub_status,
                                data={
                                    'sensor_data': sensor_data_dict,
                                    'field': field,
                                    'sub_field': sub_field
                                }
                            )
                            notification_collection.insert_one(notification.dict())
                elif status in ['warning', 'danger', 'invalid']:
                    # Handle simple alerts
                    notification = Notification(
                        notification_id=str(uuid.uuid4()),
                        user_id=sensor['owner_id'],
                        sensor_id=sensor_id,
                        message=f"{status.upper()}: Abnormal {field} reading for sensor {sensor['name']}",
                        alert_type=status,
                        data={
                            'sensor_data': sensor_data_dict,
                            'field': field
                        }
                    )
                    notification_collection.insert_one(notification.dict())
        
        # Rest of the existing code...
        result = sensor_data_collection.insert_one(sensor_data_dict)
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

# Add these new endpoints for notification handling
@router.get("/api/notifications")
async def get_notifications(
    current_user: str = Depends(get_current_user),
    limit: int = 50,
    unread_only: bool = False
):
    query = {"user_id": current_user}
    if unread_only:
        query["read"] = False
    
    notifications = list(notification_collection.find(
        query,
        sort=[("timestamp", -1)],
        limit=limit
    ))
    
    # Format results
    for notification in notifications:
        notification["_id"] = str(notification["_id"])
    
    return notifications

@router.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: str = Depends(get_current_user)
):
    result = notification_collection.delete_one(
        {
            "notification_id": notification_id,
            "user_id": current_user
        }
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}


## Registers sensors Change this to also add sensorID to user
@router.post("/api/add-sensors", response_model=SensorDefinition)
async def register_sensor(
    sensor: Dict[str, Any], 
    current_user: str = Depends(get_current_user)
):
    name = sensor.get("sensorName")
    asset_id = sensor.get("assetId")
    project_id = sensor.get("projectId")
    if not name:
        raise HTTPException(status_code=400, detail="Sensor name is required")
    
    sensor_uuid = str(uuid.uuid4())
    
    sensor_definition = SensorDefinition(
        sensor_id=str(sensor_uuid),
        name=name,
        owner_id=current_user,
        asset_ids=asset_id,
        project_ids=project_id
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
    
    projects_collection.update_one(
        {"project_id": project_id},
        {"$push": {"sensors": sensor_uuid}}
    )

    # Update the asset document to include the sensor
    assets_collection.update_one(
        {"asset_id": asset_id},
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
    print(sensor_id)
    sensor = sensors_collection.find_one({
        "sensor_id": sensor_id,
        "owner_id": current_user
    })
    print(f"Sensor found: {sensor}")
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

@router.get("/api/sensors/{asset_id}")
async def display_sensors(
    asset_id: str,
    limit: int = 100,
    current_user: str = Depends(get_current_user)
):
    """Fetch sensors based on asset_id while ensuring user has access."""

    asset = assets_collection.find_one({
        "asset_id": asset_id,
        "owner_id": current_user
    })

    if not asset:
        raise HTTPException(status_code=403, detail="Asset not found or you don't have access")

    project = projects_collection.find_one({
        "project_id": asset["project_id"],
        "owner_id": current_user
    })

    if not project:
        raise HTTPException(status_code=403, detail="This asset does not belong to a project you own")

    sensors = list(sensors_collection.find({"asset_ids": asset_id}))

    if not sensors:
        return []  # Fail-safe: Return empty list instead of an error

    # Convert MongoDB ObjectIds to strings
    for sensor in sensors:
        sensor["_id"] = str(sensor["_id"])

    return sensors