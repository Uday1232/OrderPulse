'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { Order } from '../types/order';
import { useAuthStore } from '../store/useAuthStore';
import { ApiService } from '../services/api';

interface SocketNotification {
  id: string;
  type: 'created' | 'updated';
  order: Order;
  message: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  currentStoreId: string;
  setCurrentStoreId: (storeId: string) => void;
  recentNotification: SocketNotification | null;
  clearNotification: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  currentStoreId: '',
  setCurrentStoreId: () => {},
  recentNotification: null,
  clearNotification: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [currentStoreId, setCurrentStoreId] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [recentNotification, setRecentNotification] = useState<SocketNotification | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';

  // Fetch initial stores to default to the primary store UUID
  useEffect(() => {
    let isMounted = true;
    ApiService.getStores()
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0 && !currentStoreId) {
          setCurrentStoreId(res.data[0]!.id);
        }
      })
      .catch(() => {
        // Fallback default
      });
    return () => {
      isMounted = false;
    };
  }, [currentStoreId]);

  useEffect(() => {
    const socketInstance = io(wsUrl, {
      query: {
        ...(currentStoreId ? { store_id: currentStoreId } : {}),
        ...(user?.id ? { user_id: user.id } : {}),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (currentStoreId) {
        socketInstance.emit('join:store', currentStoreId);
      }
      if (user?.id) {
        socketInstance.emit('join:user', user.id);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time Event: Order Created
    const handleCreated = (newOrder: Order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      setRecentNotification({
        id: newOrder.id,
        type: 'created',
        order: newOrder,
        message: `New Order #${newOrder.id.slice(0, 8)} created ($${Number(newOrder.total_amount).toFixed(2)})`,
      });
    };

    // Real-time Event: Order Status Updated
    const handleUpdated = (updatedOrder: Order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      setRecentNotification({
        id: updatedOrder.id,
        type: 'updated',
        order: updatedOrder,
        message: `Order #${updatedOrder.id.slice(0, 8)} status updated to ${updatedOrder.status}`,
      });
    };

    socketInstance.on('new_order', handleCreated);
    socketInstance.on('order:created', handleCreated);
    socketInstance.on('order_status_updated', handleUpdated);
    socketInstance.on('order:updated', handleUpdated);

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [wsUrl, user?.id]);

  // Handle switching store rooms
  useEffect(() => {
    if (socket && isConnected && currentStoreId) {
      socket.emit('join:store', currentStoreId);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['menu', currentStoreId] });
    }
  }, [currentStoreId, socket, isConnected, queryClient]);

  const clearNotification = () => setRecentNotification(null);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      currentStoreId,
      setCurrentStoreId,
      recentNotification,
      clearNotification,
    }),
    [socket, isConnected, currentStoreId, recentNotification]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useOrderSocket() {
  return useContext(SocketContext);
}
