from flask_socketio import emit, join_room
from ..routes.common_auth import socket_token_required

def register_notification_handlers(socketio):
    @socketio.on('connect')
    @socket_token_required
    def handle_connect(current_user):
        room = f"user_{current_user['_id']}"
        join_room(room)
        print(f"User {current_user['_id']} connected to notifications room {room}")

    @socketio.on('disconnect')
    def handle_disconnect():
        print("Client disconnected from notifications")

# def send_notification(user_id, notification_data):
#     room = f"user_{user_id}"
#     emit('new_notification', notification_data, room=room)
def send_notification(socketio, user_id, notification_data):
    room = f"user_{user_id}"
    socketio.emit('new_notification', notification_data, room=room)
    print(f"Sent notification to room {room}: {notification_data}")
