from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Notification(BaseModel):
    notification_id: str
    user_id: str
    sensor_id: str
    message: str
    alert_type: str  # 'warning', 'critical', 'info'
    read: bool = False
    timestamp: datetime = datetime.now()
    data: Optional[dict] = None