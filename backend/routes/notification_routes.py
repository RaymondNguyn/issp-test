from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..models.notification_model import Notification
from ..database import get_db
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/notifications", response_model=List[Notification])
async def get_notifications(unread_only: bool = Query(False)):
    db = get_db()["db"]
    query = {"read": False} if unread_only else {}
    
    notifications = list(db.notifications.find(query).sort("timestamp", -1))
    for notification in notifications:
        notification["notification_id"] = str(notification["_id"])
        del notification["_id"]
    
    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_as_read(notification_id: str):
    db = get_db()["db"]
    result = db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, message="Notification not found")
    
    return {"message": "Notification marked as read"}

@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str):
    db = get_db()["db"]
    result = db.notifications.delete_one({"_id": ObjectId(notification_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, message="Notification not found")
    
    return {"message": "Notification deleted"}
