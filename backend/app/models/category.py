from ..db import get_db
from bson import ObjectId

class Category:
    @staticmethod
    def create(label):
        db = get_db()
        result = db.categories.insert_one({"label": label})
        return str(result.inserted_id)

    @staticmethod
    def get_all():
        db = get_db()
        return [{"_id": str(cat["_id"]), "label": cat["label"]} for cat in db.categories.find()]

    @staticmethod
    def get_by_id(category_id):
        db = get_db()
        category = db.categories.find_one({"_id": ObjectId(category_id)})
        if category:
            category["_id"] = str(category["_id"])
        return category