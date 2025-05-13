from flask import Blueprint, jsonify,request,current_app
from bson import ObjectId
import bcrypt
from datetime import datetime

from ..models.category import Category
from ..models.user import User
from ..db import get_db
from .common_auth import token_required
from ..services.article_service import ArticleService
import jwt
from datetime import datetime, timedelta

bp= Blueprint('user_auth', __name__,url_prefix='/user_auth')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Champs requis manquants"}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email déjà utilisé"}), 409

    user = User(username=username, email=email, password=hashed_pw)
    user_id = user.save()

    # Add default categories to new user
    default_categories = ["Technology", "Science", "Business"]
    for cat_name in default_categories:
        # Find or create category
        db = get_db()
        category = db.categories.find_one({"label": cat_name})
        if not category:
            category_id = Category.create(cat_name)
        else:
            category_id = str(category["_id"])

        # Add to user
        User.add_category(user_id, category_id)

    return jsonify({"message": "Utilisateur enregistré avec succès", "user_id": str(user_id)}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email')
    username = data.get('username')
    password = data.get('password')

    if not (email or username) or not password:
        return jsonify({"error": "Email/Username et mot de passe sont requis"}), 400

    db = get_db()

    user = db.users.find_one({"email": email} if email else {"username": username})

    if not user or not bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return jsonify({"error": "Email/Username ou mot de passe invalide"}), 401

    user["_id"] = str(user["_id"])

    access_token = jwt.encode(
        {"user_id": user["_id"], "exp": datetime.utcnow() + timedelta(hours=1)},
        current_app.config['SECRET_KEY'], algorithm="HS256"
    )

    user_data = {key: value for key, value in user.items() if key != "password"}

    return jsonify({
        "message": "Connexion réussie",
        "user": user_data,
        "access_token": access_token,
    }), 200

@bp.route('/profile', methods=['GET'])
@token_required
def profile(current_user):
    categories = User.get_categories(current_user["_id"])
    user_data = {
        "username": current_user["username"],
        "email": current_user["email"],
        "points": current_user.get("points", 0),
        "role": current_user["role"],
        "categories": categories
    }
    return jsonify({"user": user_data}), 200


@bp.route('/update-profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    new_username = data.get('username')
    new_email = data.get('email')

    if not new_username and not new_email:
        return jsonify({"error": "Aucun changement détecté"}), 400

    db = get_db()

    # Check if email is already used by someone else
    if new_email:
        existing_user = db.users.find_one({"email": new_email, "_id": {"$ne": current_user["_id"]}})
        if existing_user:
            return jsonify({"error": "Email déjà utilisé"}), 409

    updates = {}
    if new_username:
        updates['username'] = new_username
    if new_email:
        updates['email'] = new_email

    db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})

    return jsonify({"message": "Profil mis à jour avec succès"}), 200


@bp.route('/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({"error": "Champs requis manquants"}), 400

    # Verify the current password
    if not bcrypt.checkpw(current_password.encode('utf-8'), current_user["password"]):
        return jsonify({"error": "Mot de passe actuel incorrect"}), 401

    # Hash the new password
    hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

    db = get_db()
    db.users.update_one({"_id": current_user["_id"]}, {"$set": {"password": hashed_pw}})

    return jsonify({"message": "Mot de passe changé avec succès"}), 200


@bp.route('/submit-article', methods=['POST'])
@token_required
def submit_article(current_user):
    data = request.get_json()

    if not data:
        return jsonify({"error": "Aucune donnée fournie"}), 400

    # Appel du service pour créer l'article
    article_id, error = ArticleService.create_article(data, user=current_user)

    if error:
        return jsonify({"error": error}), 400

    User.add_points(current_user["_id"], 20)

    return jsonify({
        "message": "Article soumis avec succès",
        "article_id": str(article_id)
    }), 201

@bp.route('/demande-admin', methods=['POST'])
@token_required
def demande_admin(current_user):
    db = get_db()

    if db.users.find_one({"_id": current_user["_id"], "admin_request": True}):
        return jsonify({"error": "Vous avez déjà une demande en attente"}), 400

    db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"admin_request": True}}
    )
    return jsonify({"message": "Demande envoyée ! Un admin va l'examiner."}), 200

@bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):

    # Supprimer le token côté client
    return jsonify({
        "message": "Déconnexion réussie. Veuillez supprimer le token côté client."
    }), 200


@bp.route('/search', methods=['GET'])
@token_required
def search_articles(current_user):
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "Le paramètre 'q' est requis"}), 400

    limit = request.args.get('limit', default=10, type=int)
    try:
        results = ArticleService.search_articles(query)[:limit]

        formatted_results = [{
            'id': article.get('_id'),
            'title': article.get('_source', {}).get('title'),
            'highlight': article.get('highlight'),
            'score': article.get('_score')
        } for article in results]

        return jsonify({
            "count": len(formatted_results),
            "results": formatted_results
        }), 200

    except Exception as e:
        current_app.logger.error(f"Erreur de recherche: {str(e)}")
        return jsonify({"error": "Erreur lors de la recherche"}), 500