from pymongo import MongoClient, ASCENDING, DESCENDING
def setup_mongodb():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["setu"]
    
    # Create collections with indexes
    if "users" not in db.list_collection_names():
        db.create_collection("users")
        db.users.create_index([("email", ASCENDING)], unique=True)
    
    if "sensors" not in db.list_collection_names():
        db.create_collection("sensors")
        db.sensors.create_index([("sensor_id", ASCENDING)], unique=True)
        db.sensors.create_index([("owner_id", ASCENDING)])  # For finding user's sensors
        db.sensors.create_index([("project_ids", ASCENDING)])  # For finding project's sensors
    
    if "sensor_data" not in db.list_collection_names():
        db.create_collection("sensor_data")
        db.sensor_data.create_index([("sensor_id", ASCENDING), ("timestamp", DESCENDING)])
    
    if "projects" not in db.list_collection_names():
        db.create_collection("projects")
        db.projects.create_index([("project_id", ASCENDING)], unique=True)
        db.projects.create_index([("owner_id", ASCENDING)])  # For finding user's projects
        db.projects.create_index([("name", ASCENDING), ("owner_id", ASCENDING)])  # For checking duplicates per user
    
    if "assets" not in db.list_collection_names():
        db.create_collection("assets")
        db.assets.create_index([("project_id", ASCENDING)])
        db.assets.create_index([("owner_id", ASCENDING)])  # For finding user's projects
        db.assets.create_index([("name", ASCENDING), ("owner_id", ASCENDING)])  # For checking duplicates per user
    
    return {
        "client": client,
        "db": db,
        "users": db["users"],
        "sensors": db["sensors"],
        "sensor_data": db["sensor_data"],
        "projects": db["projects"],
        "assets": db["assets"]
    }

mongodb = setup_mongodb()
db = mongodb["db"]
users_collection = mongodb["users"]
sensors_collection = mongodb["sensors"] 
sensor_data_collection = mongodb["sensor_data"]
projects_collection = mongodb["projects"]
assets_collection = mongodb["assets"]