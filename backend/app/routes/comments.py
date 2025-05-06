from flask import Blueprint, request, jsonify
from ..services.comment_service import CommentService
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

    comment_id = CommentService.add_comment(current_user["_id"], article_id, content)
    return jsonify({"message": "Comment added", "comment_id": comment_id}), 201

@bp.route("/<article_id>", methods=["GET"])
@token_required
def get_comments(current_user, article_id):
    comments = CommentService.get_comments_for_article(article_id)
    return jsonify({"comments": comments}), 200


@bp.route("/update/<comment_id>", methods=["PUT"])
@token_required
def update_comment(current_user, comment_id):
    data = request.get_json()
    new_content = data.get("content")
    if not new_content:
        return jsonify({"error": "New content is required"}), 400

    success = CommentService.update_comment(comment_id, current_user["_id"], new_content)
    if success:
        return jsonify({"message": "Comment updated successfully"}), 200
    else:
        return jsonify({"error": "Update failed (wrong user or comment not found)"}), 404

@bp.route("/delete/<comment_id>", methods=["DELETE"])
@token_required
def delete_comment(current_user, comment_id):
    success = CommentService.delete_comment(comment_id, current_user["_id"])
    if success:
        return jsonify({"message": "Comment deleted successfully"}), 200
    else:
        return jsonify({"error": "Delete failed (wrong user or comment not found)"}), 404
