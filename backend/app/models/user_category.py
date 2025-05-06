from ..db import get_db
from bson import ObjectId

class UserCategory:
    @staticmethod
    def add_category_to_user(user_id, category_id):
        db = get_db()
        db.user_categories.insert_one({
            "user_id": ObjectId(user_id),
            "category_id": ObjectId(category_id)
        })

    @staticmethod
    def get_user_categories(user_id):
        db = get_db()
        pipeline = [
            {"$match": {"user_id": ObjectId(user_id)}},
            {"$lookup": {
                "from": "categories",
                "localField": "category_id",
                "foreignField": "_id",
                "as": "category"
            }},
            {"$unwind": "$category"},
            {"$project": {
                "_id": 0,
                "category_id": {"$toString": "$category._id"},
                "label": "$category.label"
            }}
        ]
        return list(db.user_categories.aggregate(pipeline))

    @staticmethod
    def remove_category_from_user(user_id, category_id):
        db = get_db()
        result = db.user_categories.delete_one({
            "user_id": ObjectId(user_id),
            "category_id": ObjectId(category_id)
        })
        return result.deleted_count > 0