import requests
import random
from datetime import datetime

def generate_mock_data():
    return {
        "sensor_id": "b65a69ab-8ce1-4545-ad70-06b2230e5f2e",
        "adc": random.randint(0, 1023),
        "position": f"{random.uniform(-90, 90)}, {random.uniform(-180, 180)}", 
        "roll": random.uniform(-180, 180),
        "pitch": -10000,
        "accelerometer": {
            "x": random.uniform(-10, 10),
            "y": random.uniform(-10, 10),
            "z": random.uniform(-10, 10)
        },
        "magnetometer": {
            "x": random.uniform(-50, 50),
            "y": random.uniform(-50, 50),
            "z": random.uniform(-50, 50)
        },
        "gyroscope": {
            "x": random.uniform(-500, 500),
            "y": random.uniform(-500, 500),
            "z": random.uniform(-500, 500)
        },
        "temperature": random.uniform(20, 30),
        "timestamp": datetime.utcnow().isoformat()
    }

url = "http://localhost:8000/api/receive-sensor-data"

mock_data = generate_mock_data()

response = requests.post(url, json=mock_data)

# Check the response
if response.status_code == 200:
    print("Data sent successfully!")
    print(response.json())
else:
    print(f"Failed to send data: {response.status_code}")
    print(response.text)
