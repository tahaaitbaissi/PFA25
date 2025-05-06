from bson import ObjectId
from datetime import datetime

class Comment:
    def __init__(self, user_id, article_id, content):
        self.user_id = ObjectId(user_id)
        self.article_id = ObjectId(article_id)
        self.content = content
        self.created_at = datetime.utcnow()
        self.updated_at = None

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "article_id": self.article_id,
            "content": self.content,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
