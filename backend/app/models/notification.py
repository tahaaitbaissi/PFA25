from ..db import get_db
from bson import ObjectId
from datetime import datetime

class Notification:
    @classmethod
    def get_user_notifications(cls, user_id, page=1, per_page=10):
        skip = (page - 1) * per_page
        return list(get_db().notifications.find(
            {"user_id": ObjectId(user_id)}
        ).sort("created_at", -1).skip(skip).limit(per_page))

    @classmethod
    def create_and_send(cls, user_id, content, notification_type, reference_id=None):
        """Create and store a new notification"""
        notification = {
            "user_id": ObjectId(user_id),
            "content": content,
            "type": notification_type,
            "is_read": False,
            "created_at": datetime.utcnow()
        }

        # Safely handle reference_id
        if reference_id:
            if ObjectId.is_valid(reference_id):
                notification["reference_id"] = ObjectId(reference_id)
            else:
                notification["reference_message"] = reference_id  # fallback to plain message if not a valid ID

        get_db().notifications.insert_one(notification)
        return notification

    @classmethod
    def mark_as_read(cls, notification_id, user_id):
        get_db().notifications.update_one(
            {"_id": ObjectId(notification_id), "user_id": ObjectId(user_id)},
            {"$set": {"is_read": True}}
        )

    @classmethod
    def mark_all_as_read(cls, user_id):
        get_db().notifications.update_many(
            {"user_id": ObjectId(user_id)},
            {"$set": {"is_read": True}}
        )

    @classmethod
    def delete_notification(cls, notification_id, user_id):
        get_db().notifications.delete_one(
            {"_id": ObjectId(notification_id), "user_id": ObjectId(user_id)}
        )
