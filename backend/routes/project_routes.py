from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("")
async def get_projects():
    # Mock data for testing
    return {
        "projects": [
            {
                "id": "project1",
                "name": "Test Project",
                "description": "A test project"
            }
        ]
    }

@router.post("")
async def create_project(project: Dict[str, Any]):
    # Mock implementation
    return {
        "id": "new_project",
        "name": project["name"],
        "description": project["description"]
    }

from fastapi import APIRouter, HTTPException, Depends
from services.sensor_service import process_sensor_data
from models.sensor_model import BaseSensorData, SensorDefinition
from models.project_model import ProjectInDB
from database import sensor_data_collection, sensors_collection, users_collection, projects_collection
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

router = APIRouter()

@router.post("/api/add-projects", response_model=ProjectInDB)
async def register_project(
    project: Dict[str, Any], 
    current_user: str = Depends(get_current_user)
):

    name = project.get("project_name")
    description = project.get("description")
    
    if not name or not description:
        raise HTTPException(status_code=400, detail="Project name and description are required")
    
    project_uuid = str(uuid.uuid4())
    
    new_project = {
        "project_id": project_uuid,
        "name": name,
        "description": description,
        "owner_id": current_user,
        "sensor_ids": []
    }

    result = projects_collection.insert_one(new_project)

    created_project = new_project
    created_project["_id"] = str(result.inserted_id)

    users_collection.update_one(
        {"email": current_user},
        {"$push": {"projects": project_uuid}}
    )

    return ProjectInDB(**created_project)

@router.get("/api/projects", response_model=List[ProjectInDB])
async def list_projects(current_user: str = Depends(get_current_user)):
    projects = list(projects_collection.find({"owner_id": current_user}))

    for project in projects:
        if project["_id"] is not None:
            project["_id"] = str(project["_id"])
        else:
            project["_id"] = None

    return projects

@router.get("/api/projects/{project_id}", response_model=List[ProjectInDB])
async def list_projects_details(
    project_id: str,
    limit: int = 100,
    current_user: str = Depends(get_current_user)
):
    
    project = projects_collection.find_one({"project_id": project_id,
                                             "owner_id": current_user})
    
    if not project:
        raise HTTPException(status_code=404, detail="Sensor not found or you don't have access")


    query = {"project_id": project_id}
    results = list(projects_collection.find(
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

## Add sensor to project
@router.post("/api/projects/{project_id}/add-sensor", response_model=SensorDefinition)
async def add_sensor_to_project(
    project_id: str,  # Project ID parameter
    sensor: Dict[str, Any],  # Sensor data (in the body of the request)
    current_user: str = Depends(get_current_user)  # Get the current authenticated user
):
    name = sensor.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Sensor name is required")
    
    # Generate a unique sensor UUID
    sensor_uuid = str(uuid.uuid4())
    
    # Create the sensor definition
    sensor_definition = SensorDefinition(
        sensor_id=sensor_uuid,
        name=name,
        owner_id=current_user,
        project_ids=[]  # Initialize project_ids as an empty list
    )
    
    # Save the sensor to the sensors collection
    document_dict = sensor_definition.dict(by_alias=True, exclude_none=True)
    result = sensors_collection.insert_one(document_dict)
    
    created_sensor = sensor_definition.dict()
    created_sensor["_id"] = str(result.inserted_id)

    # Add the sensor UUID to the project's sensor_ids
    project = projects_collection.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update the project with the new sensor ID
    projects_collection.update_one(
        {"project_id": project_id},
        {"$push": {"sensor_ids": sensor_uuid}}  # Add the sensor UUID to the project's sensor_ids array
    )

    # Add the project_id to the sensor's project_ids array
    sensors_collection.update_one(
        {"sensor_id": sensor_uuid},
        {"$push": {"project_ids": project_id}} 
    )
    
    # Optionally, associate the sensor with the current user if needed
    users_collection.update_one(
        {"email": current_user},
        {"$push": {"sensors": sensor_uuid}}  # Add the sensor to the user's sensors array
    )
    
    return SensorDefinition(**created_sensor)