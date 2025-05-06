from flask import Blueprint, jsonify, request
from bson import ObjectId
from ..models.user import User
from ..db import get_db
from .common_auth import token_required
from ..services.article_service import ArticleService
import jwt
from datetime import datetime, timedelta

bp = Blueprint('admin', __name__, url_prefix='/admin_auth')


# === Gestion Utilisateurs ===
@bp.route('/users', methods=['GET'])
@token_required
def list_users(current_user):
    if current_user["role"] != "admin":
        return jsonify({"error": "Accès refusé"}), 403

    users = User.get_all()
    return jsonify(users), 200


@bp.route('/users/<user_id>/suspend', methods=['PUT'])
@token_required
def suspend_user(current_user, user_id):
    if current_user["role"] != "admin":
        return jsonify({"error": "Accès refusé"}), 403

    User.toggle_user_status(user_id, True)
    return jsonify({"message": "Utilisateur suspendu"}), 200


@bp.route('/users/<user_id>/unsuspend', methods=['PUT'])
@token_required
def unsuspend_user(current_user, user_id):
    if current_user["role"] != "admin":
        return jsonify({"error": "Accès refusé"}), 403

    User.toggle_user_status(user_id, False)
    return jsonify({"message": "Suspension annulée"}), 200


# === Gestion Articles ===
@bp.route('/articles', methods=['GET'])
@token_required
def list_articles(current_user):
    """Liste tous les articles (accès admin seulement)"""
    if current_user["role"] != "admin":
        return jsonify({"error": "Accès refusé"}), 403

    try:
        articles = ArticleService.get_all_articles()
        return jsonify(articles), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/articles/<article_id>', methods=['DELETE'])
@token_required
def admin_delete_article(current_user, article_id):
    """Suppression forcée par un admin (contourne les vérifications de propriété)"""
    if current_user["role"] != "admin":
        return jsonify({"error": "Accès refusé"}), 403

    # On utilise la méthode existante mais en passant None comme user pour bypass les vérifications
    success, error = ArticleService.delete_article(article_id, user=None)

    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Article supprimé avec succès"}), 200


@bp.route('/demandes-admin', methods=['GET'])
@token_required
def get_demandes_admin(current_user):
    if current_user["role"] != "admin":
        return jsonify({"error": "Accès réservé aux admins"}), 403

    db = get_db()
    # Récupère TOUTES les demandes (même score=0)
    demandes = list(db.users.find(
        {"admin_request": True},
        {"username": 1, "points": 1, "email": 1, "_id": 1}
    ))

    # Convertit ObjectId en string pour le frontend
    for d in demandes:
        d["_id"] = str(d["_id"])

    return jsonify(demandes), 200


@bp.route('/valider-admin/<user_id>', methods=['POST'])
@token_required
def valider_admin(current_user, user_id):
    if current_user["role"] != "admin":
        return jsonify({"error": "Action non autorisée"}), 403

    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})

    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": "admin", "admin_request": False}}
    )
    return jsonify({"message": f"{user['username']} est maintenant admin !"}), 200


@bp.route('/refuser-admin/<user_id>', methods=['POST'])
@token_required
def refuser_admin(current_user, user_id):
    if current_user["role"] != "admin":
        return jsonify({"error": "Action non autorisée"}), 403

    db = get_db()
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"admin_request": False}}
    )
    return jsonify({"message": "Demande refusée avec succès"}), 200