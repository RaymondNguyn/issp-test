from fastapi import APIRouter, HTTPException, Depends
from services.sensor_service import process_sensor_data
from models.sensor_model import BaseSensorData, SensorDefinition
from models.project_model import ProjectInDB
from models.assets_model import BaseAssetData, AssetDefinition
from database import sensor_data_collection, sensors_collection, users_collection, projects_collection, assets_collection
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
        "date": project.get("date"),
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

@router.get("/api/projects/{project_id}/assets", response_model=List[AssetDefinition])
async def list_project_assets(
    project_id: str,
    limit: int = 100,
    current_user: str = Depends(get_current_user)
):
    # Find the project to verify access
    project = projects_collection.find_one({"project_id": project_id, "owner_id": current_user})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    # Query assets that belong to this project
    query = {"project_id": project_id}
    assets = list(assets_collection.find(query).sort("timestamp").limit(limit))

    # Convert MongoDB ObjectIds to strings
    for asset in assets:
        asset["_id"] = str(asset["_id"])
    
    print(assets)
    return assets

## Add sensor to project
@router.post("/api/projects/{project_id}/add-assets", response_model=AssetDefinition)
async def add_asset_to_project(
    project_id: str,  
    asset_data: Dict[str, Any], 
    current_user: str = Depends(get_current_user)  
):
    name = asset_data.get("asset_name")  # Ensure correct field extraction
    description = asset_data.get("description")
    date = asset_data.get("date", None)

    if not name:
        raise HTTPException(status_code=400, detail="Asset name is required")
    
    # Generate a unique asset UUID
    asset_uuid = str(uuid.uuid4())
    
    # Create the asset definition
    asset_definition = AssetDefinition(
        asset_id=asset_uuid,
        name=name,
        description=description,
        date=date,
        owner_id=current_user,
        project_id=project_id,
        sensor_ids=[]
    )

    # Convert to dictionary and explicitly add project_id
    document_dict = asset_definition.dict(by_alias=True, exclude_none=True)
    document_dict["project_id"] = project_id  # Ensure this field is included
    
    # Save to assets collection
    result = assets_collection.insert_one(document_dict)
    
    created_asset = asset_definition.dict()
    created_asset["_id"] = str(result.inserted_id)

    # Add asset to the project's asset_ids
    project = projects_collection.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    projects_collection.update_one(
        {"project_id": project_id},
        {"$push": {"asset_ids": asset_uuid}}
    )
    
    # Associate asset with the current user
    users_collection.update_one(
        {"email": current_user},
        {"$push": {"assets": asset_uuid}}
    )
    
    return AssetDefinition(**created_asset)

