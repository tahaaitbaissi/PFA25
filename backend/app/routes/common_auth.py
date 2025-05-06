from flask import jsonify, request, current_app
from bson import ObjectId
import jwt
from datetime import datetime, timedelta
from functools import wraps
from ..db import get_db
from flask import Blueprint


bp = Blueprint('common_auth', __name__, url_prefix='/auth')


def generate_refresh_token(user_id):
    refresh_token = jwt.encode(
        {"user_id": user_id, "exp": datetime.utcnow() + timedelta(days=30)},
        current_app.config['SECRET_KEY'],
        algorithm="HS256"
    )
    return refresh_token


def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token manquant ou mal formé"}), 401

        token = auth_header.split(" ")[1]

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            db = get_db()
            current_user = db.users.find_one({"_id": ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({"error": "Utilisateur introuvable"}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expiré"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token invalide"}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 401

        return f(current_user, *args, **kwargs)
    return decorated_function


def socket_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.args.get('token')
        if not token:
            return False

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = get_db().users.find_one({"_id": ObjectId(data["user_id"])})
            if not current_user:
                return False
        except Exception:
            return False

        return f(current_user, *args, **kwargs)

    return decorated