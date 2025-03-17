import pytest
from datetime import datetime, timezone
from services.sensor_service import process_sensor_data, classify_alert
from models.sensor_model import BaseSensorData

@pytest.fixture
def sample_sensor_data():
    return {
        "sensor_id": "test_sensor",
        "timestamp": datetime.now(timezone.utc),
        "temperature": 25.5,
        "accelerometer": {"x": 0.1, "y": 0.2, "z": 0.3},
        "position": "45.123,-122.456"
    }

@pytest.fixture
def sample_history():
    return [
        {
            "readings": {
                "temperature": 24.0,
                "accelerometer": {"x": 0.1, "y": 0.2, "z": 0.3}
            }
        },
        {
            "readings": {
                "temperature": 24.5,
                "accelerometer": {"x": 0.1, "y": 0.2, "z": 0.3}
            }
        }
    ] * 6  # Create 12 history entries

def test_process_sensor_data(sample_sensor_data):
    result = process_sensor_data(sample_sensor_data.copy())  # Use copy to avoid modifying fixture
    
    # Debugging statements
    print(f"Result Type: {type(result)}")
    print(f"Result Content: {result}")

    assert isinstance(result, BaseSensorData), f"Expected {BaseSensorData}, got {type(result)}"
    assert result.sensor_id == sample_sensor_data["sensor_id"]
    assert "temperature" in result.readings
    assert "accelerometer" in result.readings
    assert result.readings["accelerometer"]["x"] == 0.1

def test_process_sensor_data_missing_id():
    invalid_data = {"temperature": 25.5}
    with pytest.raises(ValueError, match="sensor_id is required"):
        process_sensor_data(invalid_data)

def test_classify_alert(sample_sensor_data, sample_history):
    alerts = classify_alert({"readings": sample_sensor_data}, sample_history)
    
    # Debugging statements
    print(f"Alerts: {alerts}")

    assert isinstance(alerts, dict)
    
    # Test temperature alert (25.5 vs avg 24.25 -> should trigger warning)
    assert "temperature" in alerts
    assert alerts["temperature"] in ["good", "warning", "danger"]

def test_classify_alert_invalid_position():
    data = {
        "readings": {
            "position": "91,181"  # Invalid coordinates
        }
    }
    alerts = classify_alert(data, [{}] * 12)
    
    # Debugging statement
    print(f"Position Alert: {alerts['position']}")

    assert alerts["position"] == "invalid"
