import jwt
from flask import request, jsonify, current_app
from functools import wraps
from datetime import datetime

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        # Check if token is in the Authorization header
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({"error": "Token manquant"}), 401

        try:
            # Decode the token
            decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = decoded_token['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Le token a expiré"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token invalide"}), 401

        return f(current_user_id, *args, **kwargs)
    return decorated_function
