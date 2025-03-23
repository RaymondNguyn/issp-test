from locust import HttpUser, task, between
import json
import uuid
import logging
import random

class SensorAPIUser(HttpUser):
    # Increase wait time between tasks to reduce load
    wait_time = between(3, 5)  # Increased from 1-3 to 3-5 seconds
    token = None
    sensor_id = None

    # Add connection pooling settings
    connection_timeout = 30
    network_timeout = 30
    max_retries = 1
    pool_size = 100

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.client.keep_alive = True

    def on_start(self):
        """Initialize user with login"""
        try:
            # Login using OAuth2 form data format
            credentials = {
                "username": "test@test.com",  # email is used as username
                "password": "testpassword123",
                "grant_type": "password"  # Required for OAuth2 password flow
            }
            logging.info("Attempting to login...")
            response = self.client.post("/token", data=credentials)
            logging.info(f"Login response status: {response.status_code}")
            if response.status_code == 200:
                self.token = response.json()["access_token"]
                self.client.headers = {'Authorization': f'Bearer {self.token}'}
                
                # Register a test sensor
                sensor_data = {"name": f"Test Sensor {uuid.uuid4()}"}
                response = self.client.post("/sensors/api/add-sensors", json=sensor_data)
                logging.info(f"Sensor registration response status: {response.status_code}")
                if response.status_code == 200:
                    self.sensor_id = response.json()["sensor_id"]
            else:
                logging.error(f"Login failed with response: {response.text}")
        except Exception as e:
            logging.error(f"Error in on_start: {str(e)}")
            raise

    @task(2)
    def get_user_info(self):
        """Test getting user information"""
        try:
            response = self.client.get("/api/user")
            logging.info(f"Get user info status: {response.status_code}")
        except Exception as e:
            logging.error(f"Error in get_user_info: {str(e)}")

    @task(3)
    def list_sensors(self):
        """Test listing all sensors"""
        try:
            response = self.client.get("/sensors/api/sensors")
            logging.info(f"List sensors status: {response.status_code}")
        except Exception as e:
            logging.error(f"Error in list_sensors: {str(e)}")

    @task(4)
    def submit_sensor_reading(self):
        """Test submitting sensor readings"""
        if self.sensor_id:
            try:
                sensor_data = {
                    "sensor_id": self.sensor_id,
                    "temperature": round(random.uniform(20.0, 30.0), 2),
                    "humidity": round(random.uniform(40, 80), 2),
                    "accelerometer": {
                        "x": round(random.uniform(-1, 1), 3),
                        "y": round(random.uniform(-1, 1), 3),
                        "z": round(random.uniform(-1, 1), 3)
                    },
                    "timestamp": "2025-03-19T10:18:55"
                }
                response = self.client.post("/sensors/api/receive-sensor-data", json=sensor_data, timeout=10)
                logging.info(f"Submit sensor reading status: {response.status_code}")
            except Exception as e:
                logging.error(f"Error in submit_sensor_reading: {str(e)}")

    @task(2)
    def get_sensor_data(self):
        """Test retrieving sensor data"""
        if self.sensor_id:
            try:
                response = self.client.get(f"/sensors/api/sensor-data/{self.sensor_id}?limit=10", timeout=10)
                logging.info(f"Get sensor data status: {response.status_code}")
            except Exception as e:
                logging.error(f"Error in get_sensor_data: {str(e)}")
