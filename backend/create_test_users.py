from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["issp"]
users_collection = db["users"]

# Test users from our MEMORY
test_users = [
    # Admin accounts (approved)
    {
        "name": "Test Admin",
        "email": "test@example.com",
        "password": "test123",
        "status": "approved",
        "sensors": [],
        "projects": []
    },
    {
        "name": "Rishi Admin",
        "email": "rishi@example.com",
        "password": "pass123",
        "status": "approved",
        "sensors": [],
        "projects": []
    },
    # Regular accounts (pending)
    {
        "name": "John Smith",
        "email": "john@example.com",
        "password": "john123",
        "status": "pending",
        "sensors": [],
        "projects": []
    },
    {
        "name": "Sarah Johnson",
        "email": "sarah@example.com",
        "password": "sarah123",
        "status": "pending",
        "sensors": [],
        "projects": []
    },
    {
        "name": "Michael Lee",
        "email": "michael@example.com",
        "password": "michael123",
        "status": "pending",
        "sensors": [],
        "projects": []
    },
    {
        "name": "Emily Chen",
        "email": "emily@example.com",
        "password": "emily123",
        "status": "pending",
        "sensors": [],
        "projects": []
    }
]

# Remove existing users
users_collection.delete_many({})

# Insert test users
users_collection.insert_many(test_users)

print("Test users created successfully!")
print("\nVerifying users in database:")
for user in users_collection.find():
    print(f"{user['name']} ({user['email']}) - {user['status']}")
