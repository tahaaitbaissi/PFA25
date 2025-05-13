from bson import ObjectId
from datetime import datetime
from ..db import get_db
from ..models.comment import Comment # Assuming Comment model is used for structure

class CommentService:
    @staticmethod
    def add_comment(user_id, article_id, content):
        db = get_db()
        # Ensure user_id and article_id are stored as ObjectId
        comment_data = {
            "user_id": ObjectId(user_id),
            "article_id": ObjectId(article_id),
            "content": content,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow() # Add updated_at field
        }
        result = db.comments.insert_one(comment_data)

        # After adding, fetch the newly added comment with user info to return
        # This ensures the frontend gets the same structure as get_comments_for_article
        new_comment_id = result.inserted_id
        # Use the modified get_comments_for_article to fetch the single comment with user data
        # We can adapt get_comments_for_article to handle fetching by comment_id if needed,
        # but for simplicity now, let's just return a basic structure or refetch the list.
        # A better approach would be to return the full comment object including username from add_comment
        # Let's simulate returning the structure the frontend expects after adding
        # You might need to fetch the user here to get the username
        user = db.users.find_one({"_id": ObjectId(user_id)}, {"username": 1}) # Fetch username
        added_comment = {
            "_id": str(new_comment_id),
            "user_id": str(user_id),
            "article_id": str(article_id),
            "content": content,
            "created_at": datetime.utcnow().isoformat(), # Return as ISO string
            "author": {"username": user.get("username", "Anonyme")} if user else {"username": "Anonyme"} # Include author.username
        }
        return added_comment # Return the structure the frontend expects


    @staticmethod
    def get_comments_for_article(article_id):
        db = get_db()

        try:
            # Convert article_id string to ObjectId
            article_obj_id = ObjectId(article_id)
        except Exception as e:
            print(f"Error converting article_id to ObjectId: {str(e)}")
            return [] # Return empty list on invalid ID

        try:
            # Find comments for the article
            comments_cursor = db.comments.find({"article_id": article_obj_id})

            comments_list = []
            for comment in comments_cursor:
                # Fetch the user document for each comment's user_id
                user = db.users.find_one({"_id": comment["user_id"]}, {"username": 1}) # Only fetch username

                # Convert ObjectIds to strings and add username
                comment_data = {
                    "_id": str(comment["_id"]),
                    "user_id": str(comment["user_id"]),
                    "article_id": str(comment["article_id"]),
                    "content": comment["content"],
                    "created_at": comment["created_at"].isoformat() if isinstance(comment["created_at"], datetime) else comment["created_at"], # Ensure ISO format
                    "updated_at": comment["updated_at"].isoformat() if isinstance(comment.get("updated_at"), datetime) else comment.get("updated_at"), # Ensure ISO format
                    # Add the author's username under an 'author' key
                    "author": {"username": user.get("username", "Anonyme")} if user else {"username": "Anonyme"}
                }
                comments_list.append(comment_data)

            return comments_list
        except Exception as e:
            print(f"Error fetching comments: {str(e)}")
            return [] # Return empty list on error


    @staticmethod
    def update_comment(comment_id, user_id, new_content):
        db = get_db()
        try:
            # Convert IDs to ObjectId
            comment_obj_id = ObjectId(comment_id)
            user_obj_id = ObjectId(user_id)
        except Exception:
            return False # Return False on invalid ID

        result = db.comments.update_one(
            {"_id": comment_obj_id, "user_id": user_obj_id},
            {"$set": {"content": new_content, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    @staticmethod
    def delete_comment(comment_id, user_id):
        db = get_db()
        try:
            # Convert IDs to ObjectId
            comment_obj_id = ObjectId(comment_id)
            user_obj_id = ObjectId(user_id)
        except Exception:
            return False # Return False on invalid ID

        result = db.comments.delete_one(
            {"_id": comment_obj_id, "user_id": user_obj_id}
        )
        return result.deleted_count > 0
