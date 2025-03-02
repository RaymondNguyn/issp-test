from pydantic import BaseModel
from datetime import datetime

# Define Pydantic models for accelerometer, magnetometer, and gyroscope data
class AccelerometerData(BaseModel):
    x: float
    y: float
    z: float

class MagnetometerData(BaseModel):
    x: float
    y: float
    z: float

class GyroscopeData(BaseModel):
    x: float
    y: float
    z: float

# Define the main sensor data model with all fields
class SensorData(BaseModel):
    sensor_id: str
    adc: int
    position: str  # Assuming it's a string like "lat, long" or "x, y, z"
    roll: float
    pitch: float
    accelerometer: AccelerometerData
    magnetometer: MagnetometerData
    gyroscope: GyroscopeData
    temperature: float
    timestamp: datetime