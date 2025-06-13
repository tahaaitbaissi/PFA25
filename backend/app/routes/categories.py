from flask import Blueprint, jsonify, request
from bson import ObjectId
from ..models.category import Category
from ..models.user import User
from ..models.user_category import UserCategory
from .common_auth import token_required,admin_required
from ..db import get_db

bp = Blueprint('categories', __name__, url_prefix='/categories')


@bp.route('/', methods=['POST'])
@token_required
@admin_required
def create_category(current_user):
    data = request.get_json()
    label = data.get('label')

    if not label:
        return jsonify({"error": "Category label is required"}), 400

    # Check if category already exists
    db = get_db()
    if db.categories.find_one({"label": label}):
        return jsonify({"error": "Category already exists"}), 409

    category_id = Category.create(label)
    return jsonify({
        "message": "Category created",
        "category_id": category_id
    }), 201


@bp.route('/', methods=['GET'])
def get_all_categories():
    categories = Category.get_all()
    return jsonify(categories), 200


@bp.route('/user', methods=['GET'])
@token_required
def get_user_categories(current_user):
    categories = User.get_categories(current_user["_id"])
    return jsonify(categories), 200


@bp.route('/user', methods=['POST'])
@token_required
def add_user_category(current_user):
    data = request.get_json()
    category_id = data.get('category_id')

    if not category_id:
        return jsonify({"error": "Category ID is required"}), 400

    if not Category.get_by_id(category_id):
        return jsonify({"error": "Category not found"}), 404

    User.add_category(current_user["_id"], category_id)
    UserCategory.add_category_to_user(current_user["_id"], category_id)
    return jsonify({"message": "Category added to user"}), 201



@bp.route('/user/<category_id>', methods=['DELETE'])
@token_required
def remove_user_category(current_user, category_id):
    if not Category.get_by_id(category_id):
        return jsonify({"error": "Category not found"}), 404
    
    UserCategory.remove_category_from_user(current_user["_id"], category_id)

    if User.remove_category(current_user["_id"], category_id):
        return jsonify({"message": "Category removed from user"}), 200
    return jsonify({"error": "Category not associated with user"}), 404