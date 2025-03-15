from fastapi import APIRouter, HTTPException, Depends
from models.user_model import User
from database import users_collection
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
    }
    print("response", response)
    return response