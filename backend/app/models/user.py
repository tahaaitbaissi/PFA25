from bson import ObjectId
from feedparser.namespaces import admin

from ..db import get_db

class User:
    def __init__(self, username, email, password, points=0, role="user",admin_request="False",user_id=None):
        self.id = user_id
        self.username = username
        self.email = email
        self.password = password
        self.points = points
        self.role = role
        self.admin_request = admin_request



    def save(self):
        db = get_db()
        user_data = {
            "username": self.username,
            "email": self.email,
            "password": self.password,
            "points": self.points,
            "role": self.role,
            "admin_request": self.admin_request,
        }
        result = db.users.insert_one(user_data)
        self.id = str(result.inserted_id)
        return self.id

    @staticmethod
    def get_by_id(user_id):
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
        return user

    @staticmethod
    def get_all():
        db = get_db()
        users = []
        for u in db.users.find({}, {"password": 0}):  # Exclut le champ password
            u["_id"] = str(u["_id"])  # Convertit ObjectId en string
            users.append(u)
        return users

    @staticmethod
    def update(user_id, data):
        db = get_db()
        result = db.users.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": data},
            return_document=True
        )
        if result:
            result["_id"] = str(result["_id"])
        return result

    @staticmethod
    def delete(user_id):
        db = get_db()
        result = db.users.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0


    @staticmethod
    def toggle_user_status(user_id, suspended):
        db = get_db()
        return db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_suspended": suspended}}
        )