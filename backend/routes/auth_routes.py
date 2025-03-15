from services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from models.user_model import *
from database import users_collection
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, HTTPException, Depends
from datetime import timedelta

router = APIRouter()

### Registers and add user
@router.post("/api/register", response_model=User)
async def register(user: UserCreate):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already in use")

    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password

    result = users_collection.insert_one(user_dict)

    return {"id": str(result.inserted_id), "email": user.email, "name": user.name}


@router.post("/token", response_model=Token)
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