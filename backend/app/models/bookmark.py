from datetime import datetime
from ..db import get_db

class Bookmark:
    def __init__(self, user_id, article_id, date=None):
        self.user_id = user_id
        self.article_id = article_id
        self.date = date or datetime.utcnow()

    def save(self):
        db = get_db()
        result = db.bookmarks.insert_one({
            "user_id": self.user_id,
            "article_id": self.article_id,
            "date": self.date
        })
        return result.inserted_id

    @staticmethod
    def get_user_bookmarks(user_id):
        db = get_db()
        return list(db.bookmarks.find({"user_id": user_id}))

    @staticmethod
    def remove_bookmark(user_id, article_id):
        db = get_db()
        result = db.bookmarks.delete_one({"user_id": user_id, "article_id": article_id})
        return result.deleted_count
