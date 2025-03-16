# main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from routes.auth_routes import router as auth_routes
from routes.user_routes import router as user_routes
from routes.sensor_routes import router as sensor_routes
from routes.project_routes import router as project_routes

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth_routes)
app.include_router(user_routes)
app.include_router(sensor_routes)
app.include_router(project_routes)
