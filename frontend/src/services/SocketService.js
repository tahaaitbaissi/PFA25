import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export class SocketService {
  static socket = null;
  static userToken = null;

  static init(token) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        extraHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    this.userToken = token;
    return this.socket;
  }

  static connect() {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call init() first.');
    }
    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        resolve();
      });
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });
    });
  }

  static disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  static onNewNotification(callback) {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call init() first.');
    }
    this.socket.on('new_notification', callback);
  }

  static offNewNotification(callback) {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call init() first.');
    }
    this.socket.off('new_notification', callback);
  }
}
