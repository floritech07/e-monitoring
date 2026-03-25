import { renderHook, act } from '@testing-library/react-hooks';
import { useWebSocketClient } from '../../lib/websocket/client';

// Mock WS implementation
class MockWebSocket {
  onmessage: any;
  onopen: any;
  onclose: any;
  readyState = 0;
  
  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen();
    }, 10);
  }
  
  send(data: string) {}
  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
}

describe('useWebSocketClient (Zustand store)', () => {
  beforeEach(() => {
    // Reset Zustand store state manually for testing, 
    // or use a clear method
    useWebSocketClient.setState({ status: 'disconnected', socket: null, listeners: {}, reconnectAttempts: 0 });
    (global as any).WebSocket = MockWebSocket;
  });

  it('connects to WS and parses status', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useWebSocketClient());
    
    act(() => {
      result.current.connect("fake-token");
    });
    
    expect(result.current.status).toBe('connecting');
    
    // waiting for Mockws open simulated delay
    await new Promise(r => setTimeout(r, 20));
    
    expect(useWebSocketClient.getState().status).toBe('connected');
    expect(useWebSocketClient.getState().socket).toBeDefined();
  });

  it('pub/sub routes payloads correctly', () => {
     const fn = jest.fn();
     const unsub = useWebSocketClient.getState().subscribe('test.event', fn);
     
     // Simulate incoming WS message routing
     const mockEvent = new MessageEvent('message', {
       data: JSON.stringify({ type: 'test.event', payload: { ok: 1 } })
     });
     
     const ws = useWebSocketClient.getState().socket;
     if (ws && (ws as any).onmessage) {
         (ws as any).onmessage(mockEvent);
     }
     
     expect(fn).toHaveBeenCalledWith({ ok: 1 });
     unsub();
  });
});
