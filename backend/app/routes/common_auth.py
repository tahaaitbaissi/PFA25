from flask import jsonify, request, current_app
from bson import ObjectId
import jwt
from datetime import datetime, timedelta
from functools import wraps
from ..db import get_db
from flask import Blueprint
from flask_socketio import disconnect # Import disconnect

bp = Blueprint('common_auth', __name__, url_prefix='/auth')

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return current_app.make_default_options_response()

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
            # Log the unexpected error for debugging
            current_app.logger.error(f"Unexpected error during token validation: {str(e)}", exc_info=True)
            return jsonify({"error": "Erreur interne de validation du token"}), 500 # Use 500 for unexpected errors

        return f(current_user, *args, **kwargs)
    return decorated_function


def socket_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Get token from Authorization header for Socket.IO
        auth_header = request.headers.get('Authorization')
        token = None
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                # Malformed header
                current_app.logger.warning("Malformed Authorization header in Socket.IO connection attempt.")
                disconnect() # Disconnect the client
                return False # Indicate authentication failure

        if not token:
            # Token is missing
            current_app.logger.warning("Missing token in Socket.IO connection attempt.")
            disconnect() # Disconnect the client
            return False # Indicate authentication failure

        try:
            # Decode the token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])

            # Find the user in the database
            db = get_db()
            current_user = db.users.find_one({"_id": ObjectId(data["user_id"])})

            if not current_user:
                # User not found
                current_app.logger.warning(f"User with ID {data.get('user_id')} not found for Socket.IO connection.")
                disconnect() # Disconnect the client
                return False # Indicate authentication failure

            # If validation passed, call the original handler with the user
            return f(current_user, *args, **kwargs)

        except jwt.ExpiredSignatureError:
            current_app.logger.warning("Expired token in Socket.IO connection attempt.")
            disconnect() # Disconnect the client
            return False # Indicate authentication failure
        except jwt.InvalidTokenError:
            current_app.logger.warning("Invalid token in Socket.IO connection attempt.")
            disconnect() # Disconnect the client
            return False # Indicate authentication failure
        except Exception as e:
            # Log any other unexpected errors during validation
            current_app.logger.error(f"Unexpected error during Socket.IO token validation: {str(e)}", exc_info=True)
            disconnect() # Disconnect the client on unexpected error
            return False # Indicate authentication failure

    return decorated

# Keep the admin_required decorator as is
from functools import wraps
from flask import jsonify

def admin_required(f):
    @wraps(f)
    def decorated_function(current_user, *args, **kwargs):
        if current_user.get('role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        return f(current_user, *args, **kwargs)
    return decorated_function
