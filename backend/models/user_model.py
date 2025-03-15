from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    sensors: Optional[List[str]] = []
    projects: Optional[List[str]] = []

class User(BaseModel):
    email: str
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str