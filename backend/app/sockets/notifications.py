from flask_socketio import emit, join_room, disconnect
from ..routes.common_auth import socket_token_required
from flask import current_app # Import current_app for logging

def register_notification_handlers(socketio):
    @socketio.on('connect')
    @socket_token_required
    # Modified signature to accept extra args/kwargs from Flask-SocketIO
    def handle_connect(current_user, *args, **kwargs):
        try:
            room = f"user_{current_user['_id']}"
            join_room(room)
            current_app.logger.info(f"User {current_user['_id']} connected to notifications room {room}")
        except Exception as e:
            # Log any error during room joining or processing after auth
            current_app.logger.error(f"Error during Socket.IO connect for user {current_user.get('_id', 'unknown')}: {str(e)}", exc_info=True)
            disconnect() # Disconnect the client on error


    @socketio.on('disconnect')
    def handle_disconnect():
        # Note: current_user is NOT available in disconnect handlers
        current_app.logger.info("Client disconnected from notifications")

# def send_notification(user_id, notification_data):
#     room = f"user_{user_id}"
#     emit('new_notification', notification_data, room=room)
def send_notification(socketio, user_id, notification_data):
    room = f"user_{user_id}"
    # Ensure user_id is a string when creating the room name
    room = f"user_{str(user_id)}"
    socketio.emit('new_notification', notification_data, room=room)
    current_app.logger.info(f"Sent notification to room {room}: {notification_data}") # Changed print to logger.info

