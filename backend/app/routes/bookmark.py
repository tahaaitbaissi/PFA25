from flask import Blueprint, jsonify, request
from bson import ObjectId
from ..models.bookmark import Bookmark
from ..db import get_db
from .common_auth import token_required
from ..models.notification import Notification
from ..models.user import User
from ..sockets.notifications import send_notification
from .. import socketio

bp = Blueprint('bookmark', __name__, url_prefix='/bookmark')

@bp.route('/add', methods=['POST'])
@token_required
def add_bookmark(current_user):
    data = request.get_json()
    article_id = data.get('article_id')

    if not article_id:
        return jsonify({"error": "Article ID requis"}), 400

    bookmark = Bookmark(user_id=current_user["_id"], article_id=ObjectId(article_id))
    bookmark.save()

    User.add_points(current_user["_id"], 5)

    db = get_db()
    article = db.articles.find_one({"_id": ObjectId(article_id)})
    if article and str(article["user_id"]) != str(current_user["_id"]):
        content = f"{current_user['username']} a ajouté votre article '{article['title']}' à ses favoris"
        notification = Notification.create_and_send(
            article["user_id"],
            content,
            "bookmark",
            article_id
        )
        send_notification(socketio,str(article["user_id"]), {
            "notification_id": str(notification["_id"]),
            "content": content,
            "type": "bookmark",
            "reference_id": article_id
        })

    return jsonify({"message": "Article ajouté aux favoris"}), 201

@bp.route('/list', methods=['GET'])
@token_required
def list_bookmarks(current_user):
    bookmarks = Bookmark.get_user_bookmarks(current_user["_id"])
    formatted = [{
        "article_id": str(b['article_id']),
        "date": b['date']
    } for b in bookmarks]

    return jsonify({"bookmarks": formatted}), 200

@bp.route('/remove', methods=['DELETE'])
@token_required
def remove_bookmark(current_user):
    data = request.get_json()
    article_id = data.get('article_id')

    if not article_id:
        return jsonify({"error": "Article ID requis"}), 400

    deleted = Bookmark.remove_bookmark(current_user["_id"], ObjectId(article_id))
    if deleted:
        return jsonify({"message": "Favori supprimé"}), 200
    else:
        return jsonify({"error": "Favori non trouvé"}), 404
