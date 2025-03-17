from typing import Dict, Any
from models.sensor_model import BaseSensorData
from datetime import datetime, timezone
from typing import List, Dict, Any
import statistics

def classify_alert(sensor_data: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not history or len(history)<11:
        return {}
    
    alerts = {}
    readings = sensor_data.get("readings", {})
    
    field_sums = {}
    field_counts = {}
    
    for entry in history:
        entry_readings = entry.get("readings", {})
        for key, value in entry_readings.items():
            if isinstance(value, (int, float)):
                field_sums.setdefault(key, 0)
                field_counts.setdefault(key, 0)
                field_sums[key] += value
                field_counts[key] += 1
            elif isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    if isinstance(sub_value, (int, float)):
                        field_sums.setdefault(key, {}).setdefault(sub_key, 0)
                        field_counts.setdefault(key, {}).setdefault(sub_key, 0)
                        field_sums[key][sub_key] += sub_value
                        field_counts[key][sub_key] += 1
    
    # Check readings against thresholds
    for key, value in readings.items():
        if key in field_sums:
            if isinstance(value, (int, float)) and field_counts.get(key, 0) > 0:
                avg = field_sums[key] / field_counts[key]
                # change numbers here for threshold 20% danger 10% warning
                alerts[key] = "danger" if value > avg * 1.2 else "warning" if value > avg * 1.1 else "good"
            
            elif isinstance(value, dict) and isinstance(field_sums.get(key), dict):
                alerts[key] = {}
                for sub_key, sub_value in value.items():
                    if isinstance(sub_value, (int, float)) and sub_key in field_sums[key] and field_counts[key].get(sub_key, 0) > 0:
                        avg_sub = field_sums[key][sub_key] / field_counts[key][sub_key]
                        alerts[key][sub_key] = "danger" if sub_value > avg_sub * 1.2 else "warning" if sub_value > avg_sub * 1.1 else "good"
    
    # Handle position separately
    if "position" in readings:
        try:
            lat, lon = map(float, readings["position"].split(","))
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                alerts["position"] = "invalid"
        except ValueError:
            alerts["position"] = "invalid"
    
    return alerts


def process_sensor_data(data: Dict[str, Any]) -> BaseSensorData:
    if "sensor_id" not in data:
        raise ValueError("sensor_id is required")
    
    sensor_data = BaseSensorData(
        sensor_id=data.pop("sensor_id"),
        timestamp=data.pop("timestamp", datetime.now(timezone.utc)),
        status=data.pop("status", "active"),
        readings={}
    )

    scalar_fields = ["adc", "temperature", "roll", "pitch", "position"]
    for field in scalar_fields:
        if field in data:
            sensor_data.readings[field] = data.pop(field)

    vector_fields = ["accelerometer", "magnetometer", "gyroscope"]
    for field in vector_fields:
        if field in data:
            vector_data = data.pop(field)
            if isinstance(vector_data, dict):
                sensor_data.readings[field] = {
                    "x": vector_data.get("x"),
                    "y": vector_data.get("y"),
                    "z": vector_data.get("z")
                }
            elif isinstance(vector_data, list) and len(vector_data) >= 3:
                sensor_data.readings[field] = {
                    "x": vector_data[0],
                    "y": vector_data[1],
                    "z": vector_data[2]
                }

    for key, value in data.items():
        sensor_data.readings[key] = value

    return sensor_data