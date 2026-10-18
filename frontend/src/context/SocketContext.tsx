'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { Order, AVAILABLE_STORES } from '../types/order';

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
  currentStoreId: AVAILABLE_STORES[0]!.id,
  setCurrentStoreId: () => {},
  recentNotification: null,
  clearNotification: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [currentStoreId, setCurrentStoreId] = useState<string>(AVAILABLE_STORES[0]!.id);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [recentNotification, setRecentNotification] = useState<SocketNotification | null>(null);

  const queryClient = useQueryClient();
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInstance = io(wsUrl, {
      query: { store_id: currentStoreId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Join active store room
      socketInstance.emit('join:store', currentStoreId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time Event: Order Created
    socketInstance.on('order:created', (newOrder: Order) => {
      // Invalidate React Query cache so list refreshes immediately
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      setRecentNotification({
        id: newOrder.id,
        type: 'created',
        order: newOrder,
        message: `New Order #${newOrder.id.slice(0, 8)} created ($${newOrder.total_amount.toFixed(2)})`,
      });
    });

    // Real-time Event: Order Status Updated
    socketInstance.on('order:updated', (updatedOrder: Order) => {
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      setRecentNotification({
        id: updatedOrder.id,
        type: 'updated',
        order: updatedOrder,
        message: `Order #${updatedOrder.id.slice(0, 8)} status updated to ${updatedOrder.status}`,
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [wsUrl]);

  // Handle switching store rooms
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join:store', currentStoreId);
      // Refresh queries for new store
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
