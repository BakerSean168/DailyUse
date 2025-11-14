/**
 * useWebSocket Composable
 * WebSocket 连接管理
 */

// @ts-nocheck - socket.io-client not installed yet
import { ref } from 'vue';
// import { io, Socket } from 'socket.io-client';
// import { useAuthStore } from '@/stores/auth';

type WebSocketEventHandler = (event: string, data: any) => void;

let socket: Socket | null = null;
const isConnected = ref(false);
const reconnectAttempts = ref(0);
const maxReconnectAttempts = 5;

export function useWebSocket() {
  /**
   * 连接 WebSocket
   */
  function connect(onEvent?: WebSocketEventHandler) {
    if (socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const authStore = useAuthStore();
    const accountUuid = authStore.user?.uuid;

    if (!accountUuid) {
      console.warn('Cannot connect WebSocket: No account UUID');
      return;
    }

    // 创建 Socket.IO 连接
    socket = io(`${import.meta.env.VITE_API_URL || ''}/notifications`, {
      auth: {
        accountUuid,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    // 连接成功
    socket.on('connect', () => {
      console.log('WebSocket connected');
      isConnected.value = true;
      reconnectAttempts.value = 0;
    });

    // 连接断开
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      isConnected.value = false;
    });

    // 连接错误
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      reconnectAttempts.value += 1;
      
      if (reconnectAttempts.value >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        socket?.disconnect();
      }
    });

    // 监听所有通知事件
    if (onEvent) {
      socket.on('notification:new', (data) => onEvent('notification:new', data));
      socket.on('notification:read', (data) => onEvent('notification:read', data));
      socket.on('notification:deleted', (data) => onEvent('notification:deleted', data));
      socket.on('notification:unread-count', (data) => onEvent('notification:unread-count', data));
    }
  }

  /**
   * 断开连接
   */
  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      isConnected.value = false;
      reconnectAttempts.value = 0;
    }
  }

  /**
   * 重新连接
   */
  function reconnect() {
    disconnect();
    connect();
  }

  return {
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    reconnect,
  };
}
