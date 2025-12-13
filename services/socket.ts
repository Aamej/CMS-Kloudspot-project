import { io } from 'socket.io-client';

const SOCKET_URL = 'https://hiring-dev.internal.kloudspot.com';

// Socket Service - Singleton pattern to prevent multiple connections
class SocketService {
  private socket: any = null;
  private pendingCallbacks: Map<string, Array<(data: any) => void>> = new Map();

  connect() {
    // Already connected, just attach any pending listeners
    if (this.socket?.connected) {
      this.attachPendingListeners();
      return;
    }
    
    // If socket exists but not connected, wait a bit
    if (this.socket && !this.socket.connected) {
      this.socket.once('connect', () => {
        this.attachPendingListeners();
      });
      return;
    }

    const token = localStorage.getItem('token');

    // Optimize connection - prefer websocket, faster reconnection
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], 
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 5000,
      auth: {
        token: token || ''
      },
      transportOptions: {
        polling: {
            extraHeaders: {
                Authorization: `Bearer ${token}`
            }
        }
      }
    } as any);

    // Attach listeners once connection is established
    this.socket.on('connect', () => {
      this.attachPendingListeners();
    });

    // Silent reconnection handling - no logs in production
    this.socket.on('disconnect', () => {
      // Connection lost, socket.io will auto-reconnect
    });
  }

  // Helper to attach any callbacks that were registered before connection
  private attachPendingListeners() {
    if (!this.socket) return;
    
    this.pendingCallbacks.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
    this.pendingCallbacks.clear();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Listening for live count updates - works even if socket not connected yet
  onLiveOccupancy(callback: (data: any) => void) {
    if (this.socket?.connected) {
      // Socket ready, attach immediately
      this.socket.on('live_occupancy', callback);
    } else {
      // Socket not ready, queue it up
      if (!this.pendingCallbacks.has('live_occupancy')) {
        this.pendingCallbacks.set('live_occupancy', []);
      }
      this.pendingCallbacks.get('live_occupancy')!.push(callback);
      
      // Make sure we're connecting
      if (!this.socket) {
        this.connect();
      }
    }
  }

  onAlert(callback: (data: any) => void) {
    if (this.socket?.connected) {
      this.socket.on('alert', callback);
    } else {
      if (!this.pendingCallbacks.has('alert')) {
        this.pendingCallbacks.set('alert', []);
      }
      this.pendingCallbacks.get('alert')!.push(callback);
      
      if (!this.socket) {
        this.connect();
      }
    }
  }

  // Cleaning up listeners
  off(event: string) {
    if (!this.socket) return;
    this.socket.off(event);
  }
}

export const socketService = new SocketService();