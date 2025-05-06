from bson import ObjectId
from datetime import datetime
from ..db import get_db
from ..models.comment import Comment

class CommentService:
    @staticmethod
    def add_comment(user_id, article_id, content):
        db = get_db()
        comment = Comment(user_id, article_id, content).to_dict()
        result = db.comments.insert_one(comment)
        return str(result.inserted_id)

    @staticmethod
    def get_comments_for_article(article_id):
        db = get_db()

        try:
            article_id = ObjectId(article_id)
        except Exception as e:
            print(f"Error converting article_id to ObjectId: {str(e)}")
            return []

        try:

            comments = list(db.comments.find({"article_id": article_id}))
            for c in comments:
                c["_id"] = str(c["_id"])
                c["user_id"] = str(c["user_id"])
                c["article_id"] = str(c["article_id"])
            return comments
        except Exception as e:
            print(f"Error fetching comments: {str(e)}")
            return []


    @staticmethod
    def update_comment(comment_id, user_id, new_content):
        db = get_db()
        result = db.comments.update_one(
            {"_id": ObjectId(comment_id), "user_id": ObjectId(user_id)},
            {"$set": {"content": new_content, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    @staticmethod
    def delete_comment(comment_id, user_id):
        db = get_db()
        result = db.comments.delete_one(
            {"_id": ObjectId(comment_id), "user_id": ObjectId(user_id)}
        )
        return result.deleted_count > 0
