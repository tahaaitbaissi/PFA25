from flask import Blueprint, jsonify, request
from bson import ObjectId
from ..models.notification import Notification
from .common_auth import token_required

bp = Blueprint('notifications', __name__, url_prefix='/notifications')


@bp.route('/', methods=['GET'])
@token_required
def get_notifications(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        if page < 1 or per_page < 1:
            return jsonify({"error": "Invalid pagination parameters"}), 400

        notifications = Notification.get_user_notifications(
            current_user["_id"],
            page=page,
            per_page=per_page
        )

        # Manually serialize each notification
        serialized_notifications = []
        for notification in notifications:
            serialized = {
                '_id': str(notification['_id']),
                'user_id': str(notification['user_id']),
                'content': notification['content'],
                'type': notification.get('type'),
                'is_read': notification.get('is_read', False),
                'created_at': notification['created_at'].isoformat() if 'created_at' in notification else None
            }
            if 'reference_id' in notification and notification['reference_id']:
                serialized['reference_id'] = str(notification['reference_id'])
            serialized_notifications.append(serialized)

        return jsonify({
            "notifications": serialized_notifications,
            "page": page,
            "per_page": per_page
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/mark-read/<notification_id>', methods=['POST'])
@token_required
def mark_as_read(current_user, notification_id):
    try:
        Notification.mark_as_read(notification_id, current_user["_id"])
        return jsonify({"message": "Notification marked as read"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@bp.route('/mark-all-read', methods=['POST'])
@token_required
def mark_all_as_read(current_user):
    try:
        Notification.mark_all_as_read(current_user["_id"])
        return jsonify({"message": "All notifications marked as read"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@bp.route('/<notification_id>', methods=['DELETE'])
@token_required
def delete_notification(current_user, notification_id):
    try:
        Notification.delete_notification(notification_id, current_user["_id"])
        return jsonify({"message": "Notification deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400