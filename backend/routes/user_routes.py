from fastapi import APIRouter, HTTPException, Depends
from models.user_model import User
from database import users_collection
from bson import ObjectId
import random
import string
from services.auth_service import *
from services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter()

@router.get("/api/user", response_model=User)
async def get_user_name(current_user: str = Depends(get_current_user)):
    user_info = users_collection.find_one({"email": current_user})
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    response = {
        "email": current_user,
        "name": user_info["name"],
        "isAdmin": user_info["isAdmin"],
        "isApproved": user_info["isApproved"],
    }
    print("response", response)
    
    ###  to be removed
    admin_user = {
        "name": "Admin User",
        "email": "admin@example.com",
        "password": generate_password_hash("securepassword123"),
        "sensors": [],
        "projects": [],
        "isAdmin": True,
        "isApproved": True,
        "created_at": datetime.utcnow()
    }

    existing_user = users_collection.find_one({"email": admin_user["email"]})
    if not existing_user:
        users_collection.insert_one(admin_user)
        print("✅ Test admin user inserted successfully!")
    else:
        print("⚠️ Admin user already exists!")
        
    return response

@router.get("/api/admin/dashboard/users")
async def get_all_users(current_user: str = Depends(get_admin_user)):
    # Get all users from the database
    print("testest")
    users_cursor = users_collection.find({})
    users = []
    for user in users_cursor:
        # Convert ObjectId to string for JSON serialization
        user["_id"] = str(user["_id"])
        # Add last login if it exists
        user["lastLogin"] = user.get("lastLogin", "Never")
        users.append(user)
    
    return users

@router.put("/api/admin/users/{user_id}")
async def update_user(
    user_id: str, 
    user_data: dict,
    current_user: str = Depends(get_admin_user)
):
    # Make sure the requester is an admin
    if not users_collection.find_one({"email": current_user, "isAdmin": True}):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    # Update the user
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": user_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "User updated successfully"}

@router.post("/api/admin/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: str,
    current_user: str = Depends(get_admin_user)
):
    # Generate a temporary password
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    hashed_password = get_password_hash(temp_password)
    
    # Update the user's password
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_password}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    # In a real application, you would send an email with the temporary password
    # For this example, we'll just return it (not recommended for production)
    return {"message": "Password reset successful", "temporary_password": temp_password}

@router.post("/api/admin/users/{user_id}/login-as")
async def login_as_user(
    user_id: str,
    current_user: str = Depends(get_admin_user)
):
    # Find the user to impersonate
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Create a special token for impersonation
    # You might want to include metadata about who is doing the impersonation
    impersonation_token = create_access_token(
        data={
            "sub": user["email"],
            "impersonated_by": current_user,
            "is_impersonation": True
        }
    )
    
    return {"token": impersonation_token}