import pytest
from fastapi.testclient import TestClient
from main import app
from database import sensor_data_collection, sensors_collection, users_collection
from jose import jwt
from datetime import datetime, timedelta, timezone
from services.auth_service import get_password_hash, SECRET_KEY, ALGORITHM

@pytest.fixture
def test_client():
    return TestClient(app)

@pytest.fixture
def test_user():
    user_data = {
        "email": "test@example.com",
        "password": get_password_hash("test_password"),
        "sensors": []
    }
    # Clear and insert test user
    users_collection.delete_many({"email": user_data["email"]})
    users_collection.insert_one(user_data)
    return user_data

@pytest.fixture
def auth_token(test_user):
    # Create a test token
    token_data = {
        "sub": test_user["email"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return f"Bearer {token}"

@pytest.fixture
def test_sensor(test_user):
    sensor_data = {
        "sensor_id": "test-sensor-id",
        "name": "Test Sensor",
        "owner_id": test_user["email"]
    }
    # Clear and insert test sensor
    sensors_collection.delete_many({"sensor_id": sensor_data["sensor_id"]})
    sensors_collection.insert_one(sensor_data)
    return sensor_data

@pytest.fixture(autouse=True)
def cleanup():
    # This will run after each test
    yield
    # Clean up the test data
    sensor_data_collection.delete_many({"sensor_id": "test-sensor-id"})
    sensors_collection.delete_many({"sensor_id": "test-sensor-id"})
    users_collection.delete_many({"email": "test@example.com"})
