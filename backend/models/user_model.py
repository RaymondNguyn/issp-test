from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    sensors: Optional[List[str]] = []
    projects: Optional[List[str]] = []
    isAdmin: bool = False
    isApproved: bool = False

class User(BaseModel):
    name: str
    email: str
    isAdmin: bool = False
    isApproved: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenWithUserInfo(Token):
    isAdmin: bool = False
    isApproved: bool = False
    