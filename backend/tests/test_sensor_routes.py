import pytest
from fastapi.testclient import TestClient

def test_submit_sensor_reading(test_client, auth_token, test_sensor):
    test_data = {
        "sensor_id": test_sensor["sensor_id"],
        "temperature": 25.5,
        "humidity": 60,
        "timestamp": "2025-03-17T08:00:00Z"
    }
    
    headers = {"Authorization": auth_token}
    response = test_client.post("/sensors/api/receive-sensor-data", json=test_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "Data received successfully"
    assert "alerts" in data

def test_register_sensor(test_client, auth_token, test_user):
    sensor_data = {
        "name": "New Test Sensor"
    }
    
    headers = {"Authorization": auth_token}
    response = test_client.post("/sensors/api/add-sensors", json=sensor_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sensor_data["name"]
    assert "sensor_id" in data
    assert data["owner_id"] == test_user["email"]

def test_get_sensor_data(test_client, auth_token, test_sensor):
    headers = {"Authorization": auth_token}
    response = test_client.get(f"/sensors/api/sensor-data/{test_sensor['sensor_id']}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_list_sensors(test_client, auth_token, test_sensor):
    headers = {"Authorization": auth_token}
    response = test_client.get("/sensors/api/sensors", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Find the test sensor in the list
    test_sensor_found = False
    for sensor in data:
        if sensor["sensor_id"] == test_sensor["sensor_id"]:
            test_sensor_found = True
            break
    assert test_sensor_found, "Test sensor not found in the list"

def test_unauthorized_access(test_client):
    response = test_client.get("/sensors/api/sensors")
    assert response.status_code == 401

def test_invalid_sensor_id(test_client, auth_token):
    headers = {"Authorization": auth_token}
    response = test_client.get("/sensors/api/sensor-data/invalid-id", headers=headers)
    assert response.status_code == 404
