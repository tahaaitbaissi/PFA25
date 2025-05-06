import socketio
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime

from ..sockets.notifications import send_notification
from ..services.comment_service import CommentService
from ..models.notification import Notification
from ..db import get_db
from .. import socketio
from .common_auth import token_required

bp = Blueprint("comments", __name__, url_prefix="/comments")

@bp.route("/add", methods=["POST"])
@token_required
def add_comment(current_user):
    data = request.get_json()
    article_id = data.get("article_id")
    content = data.get("content")

    if not article_id or not content:
        return jsonify({"error": "Article ID and content are required"}), 400

    try:
        article_oid = ObjectId(article_id)
    except InvalidId:
        return jsonify({"error": "Invalid article ID format"}), 400

    comment_id = CommentService.add_comment(str(current_user["_id"]), article_id, content)

    # Get article info to create notification
    db = get_db()
    article = db.articles.find_one({"_id": article_oid})
    if article and str(article["user_id"]) != str(current_user["_id"]):
        notif_content = f"{current_user['username']} a commenté votre article '{article['title']}'"
        notification = Notification.create_and_send(
            str(article["user_id"]),
            notif_content,
            "comment",
            article_id
        )
        # Emit the notification to the article's user
        send_notification(socketio, str(article["user_id"]), {
            "notification_id": str(notification["_id"]),
            "content": notif_content,
            "type": "comment",
            "reference_id": article_id,
            "created_at": datetime.utcnow().isoformat()
        })

    return jsonify({"message": "Comment added", "comment_id": str(comment_id)}), 201

@bp.route("/<article_id>", methods=["GET"])
@token_required
def get_comments(current_user, article_id):
    try:
        ObjectId(article_id)  # Validate ID format
    except InvalidId:
        return jsonify({"error": "Invalid article ID format"}), 400

    comments = CommentService.get_comments_for_article(article_id)
    return jsonify({"comments": comments}), 200

@bp.route("/update/<comment_id>", methods=["PUT"])
@token_required
def update_comment(current_user, comment_id):
    try:
        ObjectId(comment_id)  # Validate ID format
    except InvalidId:
        return jsonify({"error": "Invalid comment ID format"}), 400

    data = request.get_json()
    new_content = data.get("content")
    if not new_content:
        return jsonify({"error": "New content is required"}), 400

    success = CommentService.update_comment(comment_id, str(current_user["_id"]), new_content)
    if success:
        return jsonify({"message": "Comment updated successfully"}), 200
    return jsonify({"error": "Update failed (wrong user or comment not found)"}), 404

@bp.route("/delete/<comment_id>", methods=["DELETE"])
@token_required
def delete_comment(current_user, comment_id):
    try:
        ObjectId(comment_id)  # Validate ID format
    except InvalidId:
        return jsonify({"error": "Invalid comment ID format"}), 400

    success = CommentService.delete_comment(comment_id, str(current_user["_id"]))
    if success:
        return jsonify({"message": "Comment deleted successfully"}), 200
    return jsonify({"error": "Delete failed (wrong user or comment not found)"}), 404