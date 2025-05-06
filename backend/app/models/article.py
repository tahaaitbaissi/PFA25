from datetime import datetime
from typing import Dict, Any, Optional, List
from bson import ObjectId
from ..db import get_db


class Article:

    def __init__(self, title, content, source_url, date_soumission=None, user_id=None, summary="", keywords=None, ai_score=None, is_fake_label=None, related_reddit_posts=None):
        self.title = title
        self.content = content
        self.source_url = source_url
        self.date_soumission = date_soumission or datetime.utcnow()
        self.user_id = user_id 
        self.summary = summary
        self.ai_score = ai_score
        self.is_fake_label = is_fake_label
        self.keywords = keywords or []
        self.related_reddit_posts = related_reddit_posts or []
        self._id = None


    def save(self):
        """Insert the article into the database."""
        db = get_db()
        article_data = {
            "title": self.title,
            "content": self.content,
            "source_url": self.source_url,
            "ai_score": self.ai_score,
            "is_fake_label": self.is_fake_label,
            "date_soumission": self.date_soumission,
            "summary": self.summary,
            "keywords": self.keywords,
            "user_id": self.user_id,
            "related_reddit_posts": self.related_reddit_posts
        }
        result = db.articles.insert_one(article_data)
        self._id = result.inserted_id 
        return str(result.inserted_id) 

    @staticmethod
    def get_all():
        """Retrieve all articles from MongoDB."""
        db = get_db()
        # Convert ObjectId to string for _id
        return [{**article, "_id": str(article["_id"])} for article in db.articles.find()]

    @staticmethod
    def get_by_id(article_id):
        """Retrieve an article by its ID."""
        db = get_db()
        try:
            # Ensure article_id is a valid ObjectId string before converting
            if not ObjectId.is_valid(article_id):
                 return None # Or raise an error

            article = db.articles.find_one({"_id": ObjectId(article_id)})
            if article:
                # Convert ObjectId to string for _id
                article["_id"] = str(article["_id"])
            return article
        except Exception as e:
             # Log the error if ObjectId conversion or DB query fails unexpectedly
             current_app.logger.error(f"Error fetching article by ID {article_id}: {str(e)}")
             return None


    @staticmethod
    def update(article_id: str, update_data: Dict[str, Any]):
        """Update an existing article in the database.

        Args:
            article_id: The ID of the article to update (as string).
            update_data: A dictionary containing the fields to update.

        Returns:
            True if update was acknowledged and modified, False otherwise.
        """
        db = get_db()
        try:
            if not ObjectId.is_valid(article_id):
                 current_app.logger.error(f"Invalid article ID format for update: {article_id}")
                 return False

            result = db.articles.update_one(
                {"_id": ObjectId(article_id)},
                {"$set": update_data}
            )
            # Check if the update was acknowledged and if any documents were modified
            return result.acknowledged and result.modified_count > 0
        except Exception as e:
            current_app.logger.error(f"Error updating article {article_id}: {str(e)}")
            return False

    @staticmethod
    def delete(article_id: str):
        """Delete an article from the database.

        Args:
            article_id: The ID of the article to delete (as string).

        Returns:
            True if deletion was acknowledged and a document was deleted, False otherwise.
        """
        db = get_db()
        try:
             if not ObjectId.is_valid(article_id):
                 current_app.logger.error(f"Invalid article ID format for delete: {article_id}")
                 return False

             result = db.articles.delete_one({"_id": ObjectId(article_id)})
             # Check if deletion was acknowledged and if a document was deleted
             return result.acknowledged and result.deleted_count > 0
        except Exception as e:
             current_app.logger.error(f"Error deleting article {article_id}: {str(e)}")
             return False

    def to_dict(self) -> Dict[str, Any]:
        """Convert Article object to a dictionary for serialization or indexing."""
        # This method is crucial for passing data to OpenSearchService
        data = {
            "title": self.title,
            "content": self.content,
            "source_url": self.source_url,
            "ai_score": self.ai_score,
            "is_fake_label": self.is_fake_label, # Include the new field
            "date_soumission": self.date_soumission,
            "summary": self.summary,
            "keywords": self.keywords,
            "user_id": self.user_id,
            "related_reddit_posts": self.related_reddit_posts
        }
        # Include _id if it exists (after saving)
        if self._id:
            data["_id"] = str(self._id) # Convert ObjectId to string
        return data
