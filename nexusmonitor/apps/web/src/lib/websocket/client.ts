import { create } from 'zustand';

type WSState = {
  socket: WebSocket | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  reconnectAttempts: number;
  connect: (token: string) => void;
  disconnect: () => void;
  send: (message: any) => void;
  // Subscribers list
  listeners: Record<string, ((payload: any) => void)[]>;
  subscribe: (eventType: string, callback: (p: any) => void) => () => void;
};

export const useWebSocketClient = create<WSState>((set, get) => ({
  socket: null,
  status: 'disconnected',
  reconnectAttempts: 0,
  listeners: {},

  connect: (token: string) => {
    if (get().socket?.readyState === WebSocket.OPEN) return;
    
    set({ status: 'connecting' });
    const wsUrl = `ws://localhost:8000/ws/stream?token=${token}`; // Env config in real UI
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      set({ status: 'connected', socket: ws, reconnectAttempts: 0 });
      console.log('WS Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') {
           ws.send(JSON.stringify({ type: 'pong' }));
           return;
        }
        
        const listeners = get().listeners[data.type] || [];
        listeners.forEach(cb => cb(data.payload));
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    ws.onclose = () => {
      set({ status: 'disconnected', socket: null });
      
      const attempts = get().reconnectAttempts;
      if (attempts < 5) {
        set({ status: 'reconnecting', reconnectAttempts: attempts + 1 });
        const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
        setTimeout(() => get().connect(token), delay);
      }
    };
  },

  disconnect: () => {
    get().socket?.close();
    set({ status: 'disconnected', socket: null, reconnectAttempts: 0 });
  },

  send: (msg: any) => {
    const { socket, status } = get();
    if (socket && status === 'connected') {
      socket.send(JSON.stringify(msg));
    }
  },

  subscribe: (eventType: string, callback: (p: any) => void) => {
    set(state => ({
      listeners: {
        ...state.listeners,
        [eventType]: [...(state.listeners[eventType] || []), callback]
      }
    }));
    
    // Return unsubscribe function
    return () => {
      set(state => ({
        listeners: {
          ...state.listeners,
          [eventType]: state.listeners[eventType].filter(cb => cb !== callback)
        }
      }));
    };
  }
}));
