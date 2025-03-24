from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure
import logging
from functools import lru_cache
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get configuration from environment variables or use defaults
MAX_POOL_SIZE = int(os.environ.get("MONGODB_MAX_POOL_SIZE", 200))
MIN_POOL_SIZE = int(os.environ.get("MONGODB_MIN_POOL_SIZE", 20))
MAX_IDLE_TIME_MS = int(os.environ.get("MONGODB_MAX_IDLE_TIME_MS", 30000))
WAIT_QUEUE_TIMEOUT_MS = int(os.environ.get("MONGODB_WAIT_QUEUE_TIMEOUT_MS", 5000))
WAIT_QUEUE_MULTIPLE = int(os.environ.get("MONGODB_WAIT_QUEUE_MULTIPLE", 500))

@lru_cache(maxsize=1)
def get_mongodb_connection():
    """Create a singleton MongoDB client with proper connection pooling configured for high load."""
    try:
        # Configure the connection pool for high load
        client = MongoClient(
            "mongodb://localhost:27017/",
            maxPoolSize=MAX_POOL_SIZE,  # Higher max connections for more users
            minPoolSize=MIN_POOL_SIZE,  # More baseline connections
            maxIdleTimeMS=MAX_IDLE_TIME_MS,  # Shorter idle time to recycle connections faster
            waitQueueTimeoutMS=WAIT_QUEUE_TIMEOUT_MS,  # Longer wait time for busy periods
            waitQueueMultiple=WAIT_QUEUE_MULTIPLE,  # Allow more operations to wait for available connections
            connectTimeoutMS=30000,
            socketTimeoutMS=45000,
            serverSelectionTimeoutMS=30000,  # How long to wait for server selection
            retryWrites=True,  # Automatically retry write operations
            retryReads=True    # Automatically retry read operations
        )
        
        # Verify connection is working
        client.admin.command('ping')
        
        # Get server stats
        server_info = client.admin.command('serverStatus')
        connection_info = server_info.get('connections', {})
        logger.info(f"Connected to MongoDB successfully. Current connections: {connection_info.get('current', 'unknown')}, available: {connection_info.get('available', 'unknown')}")
        
        return client
    except ConnectionFailure as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise

def setup_mongodb():
    """Setup MongoDB collections and indexes."""
    client = get_mongodb_connection()
    db = client["setu"]
    
    # Create collections with indexes
    if "users" not in db.list_collection_names():
        db.create_collection("users")
        db.users.create_index([("email", ASCENDING)], unique=True)
    
    if "sensors" not in db.list_collection_names():
        db.create_collection("sensors")
        db.sensors.create_index([("sensor_id", ASCENDING)], unique=True)
        db.sensors.create_index([("owner_id", ASCENDING)])
        db.sensors.create_index([("project_ids", ASCENDING)])
    
    if "sensor_data" not in db.list_collection_names():
        db.create_collection("sensor_data")
        db.sensor_data.create_index([("sensor_id", ASCENDING), ("timestamp", DESCENDING)])
    
    if "projects" not in db.list_collection_names():
        db.create_collection("projects")
        db.projects.create_index([("project_id", ASCENDING)], unique=True)
        db.projects.create_index([("owner_id", ASCENDING)])
        db.projects.create_index([("name", ASCENDING), ("owner_id", ASCENDING)])
    
    if "assets" not in db.list_collection_names():
        db.create_collection("assets")
        db.assets.create_index([("project_id", ASCENDING)])
        db.assets.create_index([("owner_id", ASCENDING)])
        db.assets.create_index([("name", ASCENDING), ("owner_id", ASCENDING)])
    
    # Add a periodic check for connection health
    import threading
    
    def monitor_connections():
        """Periodically log connection statistics."""
        try:
            conn_stats = client.admin.command('serverStatus')['connections']
            logger.info(f"MongoDB connections - current: {conn_stats['current']}, available: {conn_stats['available']}")
            threading.Timer(300, monitor_connections).start()  # Check every 5 minutes
        except Exception as e:
            logger.error(f"Error monitoring connections: {e}")
    
    # Start connection monitoring
    monitor_connections()
    
    return {
        "client": client,
        "db": db,
        "users": db["users"],
        "sensors": db["sensors"],
        "sensor_data": db["sensor_data"],
        "projects": db["projects"],
        "assets": db["assets"]
    }

# Initialize MongoDB once
mongodb = setup_mongodb()
db = mongodb["db"]
users_collection = mongodb["users"]
sensors_collection = mongodb["sensors"] 
sensor_data_collection = mongodb["sensor_data"]
projects_collection = mongodb["projects"]
assets_collection = mongodb["assets"]

# Register a shutdown function to close connections
import atexit

def close_mongodb_connection():
    """Close MongoDB connections when the application shuts down."""
    client = get_mongodb_connection()
    if client:
        logger.info("Closing MongoDB connections")
        client.close()

# Register the shutdown function
atexit.register(close_mongodb_connection)

# Function to get connection stats that can be called from routes
def get_connection_stats():
    """Get current MongoDB connection statistics."""
    client = get_mongodb_connection()
    return client.admin.command('serverStatus')['connections']