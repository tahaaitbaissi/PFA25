import eventlet
eventlet.monkey_patch()

from app import create_app,socketio
from app.config import DevelopmentConfig

# Create the Flask app using the development configuration
app = create_app(DevelopmentConfig)

if __name__ == '__main__':
    # Run the Flask app on 0.0.0.0:5000 (accessible from any IP on port 5000)
    socketio.run(app,host='0.0.0.0', port=5000, debug=True)
