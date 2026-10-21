'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { Order } from '../types/order';
import { useAuthStore } from '../store/useAuthStore';
import { ApiService } from '../services/api';
import { playChime } from '../utils/audio';

export interface SocketNotificationItem {
  id: string;
  orderId: string;
  type: 'created' | 'updated';
  title: string;
  message: string;
  status: string;
  totalAmount?: number;
  timestamp: string;
  read: boolean;
}

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
  notifications: SocketNotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  trackOrder: (orderId: string) => void;
  activePreparedOrder: Order | null;
  dismissPreparedOrder: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  currentStoreId: '',
  setCurrentStoreId: () => {},
  recentNotification: null,
  clearNotification: () => {},
  notifications: [],
  unreadCount: 0,
  markAllAsRead: () => {},
  clearAllNotifications: () => {},
  markAsRead: () => {},
  trackOrder: () => {},
  activePreparedOrder: null,
  dismissPreparedOrder: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [currentStoreId, setCurrentStoreId] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [recentNotification, setRecentNotification] = useState<SocketNotification | null>(null);
  const [notifications, setNotifications] = useState<SocketNotificationItem[]>([]);
  const [activePreparedOrder, setActivePreparedOrder] = useState<Order | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';

  // Helper to load user-scoped notifications from localStorage
  const storageKey = useMemo(() => {
    return user?.id ? `sp_notifications_${user.id}` : 'sp_notifications_guest';
  }, [user?.id]);

  // Load notifications from local storage when user switches or logs in/out
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
          return;
        }
      }
    } catch {
      // fallback
    }
    setNotifications([]);
  }, [storageKey]);

  // Persist notifications to local storage on update
  const persistNotifications = useCallback((updater: (prev: SocketNotificationItem[]) => SocketNotificationItem[]) => {
    setNotifications((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next.slice(0, 30)));
      } catch {
        // quota exceeded or SSR
      }
      return next;
    });
  }, [storageKey]);

  // Safe deduplicated notification adder
  const addNotificationItem = useCallback((item: SocketNotificationItem) => {
    persistNotifications((prev) => {
      // Prevent duplicate notification for same order, status, and type
      const exists = prev.some(
        (n) => n.orderId === item.orderId && n.status === item.status && n.type === item.type
      );
      if (exists) return prev;
      return [item, ...prev.slice(0, 24)];
    });
  }, [persistNotifications]);

  // Fetch initial stores to default to the primary store UUID
  useEffect(() => {
    let isMounted = true;
    ApiService.getStores()
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          const storeExists = res.data.some((s) => s.id === currentStoreId);
          if (!currentStoreId || !storeExists) {
            const firstActive = res.data.find((s) => s.is_active !== false) || res.data[0];
            if (firstActive) {
              setCurrentStoreId(firstActive.id);
            }
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentStoreId]);

  // Socket Connection & Event Listeners
  useEffect(() => {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    const socketInstance = io(wsUrl, {
      query: {
        ...(user?.role ? { role: user.role } : {}),
        ...(isAdmin && currentStoreId ? { store_id: currentStoreId } : {}),
        ...(user?.id ? { user_id: user.id } : {}),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Admin accounts join global admins room and specific store room
      if (isAdmin) {
        socketInstance.emit('join:admin');
        if (currentStoreId) {
          socketInstance.emit('join:store', currentStoreId);
        }
      }
      // Regular customers ONLY join their own private user room
      if (user?.id) {
        socketInstance.emit('join:user', user.id);
      }
      // Join active tracked order rooms so customer receives live status updates
      try {
        const stored: string[] = JSON.parse(localStorage.getItem('sp_tracked_orders') || '[]');
        stored.forEach((oId) => {
          socketInstance.emit('join:order', oId);
        });
      } catch {}
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time Event: Order Created
    const handleCreated = (newOrder: Order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      const isMyOrder = Boolean(user?.id && newOrder.user_id === user.id);

      // Customer should ONLY get notification if it is their order!
      if (!isAdmin && !isMyOrder) {
        return;
      }

      playChime('alert');

      if (isAdmin) {
        // Admin notification: Store received an order
        const shortId = newOrder.id.slice(0, 8);
        const amount = Number(newOrder.total_amount).toFixed(2);
        const itemCount = newOrder.items?.length || 1;

        setRecentNotification({
          id: newOrder.id,
          type: 'created',
          order: newOrder,
          message: `New Order #${shortId} received (₹${amount})`,
        });

        addNotificationItem({
          id: `${newOrder.id}-created-${Date.now()}`,
          orderId: newOrder.id,
          type: 'created',
          title: `🔔 New Order Received #${shortId}`,
          message: `Kitchen alert: ₹${amount} with ${itemCount} items placed.`,
          status: newOrder.status || 'PLACED',
          totalAmount: Number(newOrder.total_amount),
          timestamp: new Date().toISOString(),
          read: false,
        });
      } else {
        // Customer notification: Your order was placed
        const shortId = newOrder.id.slice(0, 8);
        const amount = Number(newOrder.total_amount).toFixed(2);

        setRecentNotification({
          id: newOrder.id,
          type: 'created',
          order: newOrder,
          message: `Your Order #${shortId} was placed successfully!`,
        });

        addNotificationItem({
          id: `${newOrder.id}-created-${Date.now()}`,
          orderId: newOrder.id,
          type: 'created',
          title: `🎉 Order Placed #${shortId}`,
          message: `Your order has been confirmed and sent to the kitchen (₹${amount}).`,
          status: newOrder.status || 'PLACED',
          totalAmount: Number(newOrder.total_amount),
          timestamp: new Date().toISOString(),
          read: false,
        });

        // Persist in customer local storage history for immediate sync
        try {
          const existing: Order[] = JSON.parse(localStorage.getItem('sp_my_orders') || '[]');
          const updated = [newOrder, ...existing.filter((o) => o.id !== newOrder.id)];
          localStorage.setItem('sp_my_orders', JSON.stringify(updated));
        } catch {}
      }
    };

    // Real-time Event: Order Status Updated
    const handleUpdated = (updatedOrder: Order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      let trackedOrderIds: string[] = [];
      try {
        trackedOrderIds = JSON.parse(localStorage.getItem('sp_tracked_orders') || '[]');
      } catch {}

      const isMyOrder = Boolean(
        (user?.id && updatedOrder.user_id === user.id) ||
        trackedOrderIds.includes(updatedOrder.id)
      );

      // Customer should ONLY get status updates for their own orders!
      if (!isAdmin && !isMyOrder) {
        return;
      }

      if (updatedOrder.status === 'PREPARED') {
        playChime('success');
        if (!isAdmin) {
          setActivePreparedOrder(updatedOrder);
        }
      }

      const shortId = updatedOrder.id.slice(0, 8);

      if (isAdmin) {
        // Admin notification: Kitchen order status updated
        setRecentNotification({
          id: updatedOrder.id,
          type: 'updated',
          order: updatedOrder,
          message: `Order #${shortId} status updated to ${updatedOrder.status}`,
        });

        addNotificationItem({
          id: `${updatedOrder.id}-${updatedOrder.status}-${Date.now()}`,
          orderId: updatedOrder.id,
          type: 'updated',
          title: `⚡ Order #${shortId} is ${updatedOrder.status}`,
          message: `Status updated to ${updatedOrder.status}. Dispatch/Kitchen ready.`,
          status: updatedOrder.status,
          totalAmount: Number(updatedOrder.total_amount || 0),
          timestamp: new Date().toISOString(),
          read: false,
        });
      } else {
        // Customer notification: Order ready or cancelled
        let userTitle = `📋 Order #${shortId} Status: ${updatedOrder.status}`;
        let userMsg = `Your order status is now ${updatedOrder.status}.`;

        if (updatedOrder.status === 'PREPARED') {
          userTitle = `🍽️ Your Order #${shortId} is READY!`;
          userMsg = `Your food is freshly prepared and ready for pickup!`;
        } else if (updatedOrder.status === 'CANCELLED') {
          userTitle = `⚠️ Order Cancelled #${shortId}`;
          userMsg = `Your order #${shortId} has been cancelled.`;
        }

        setRecentNotification({
          id: updatedOrder.id,
          type: 'updated',
          order: updatedOrder,
          message: userMsg,
        });

        addNotificationItem({
          id: `${updatedOrder.id}-${updatedOrder.status}-${Date.now()}`,
          orderId: updatedOrder.id,
          type: 'updated',
          title: userTitle,
          message: userMsg,
          status: updatedOrder.status,
          totalAmount: Number(updatedOrder.total_amount || 0),
          timestamp: new Date().toISOString(),
          read: false,
        });

        // Update stored customer order with new status
        try {
          const existing: Order[] = JSON.parse(localStorage.getItem('sp_my_orders') || '[]');
          const updated = existing.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
          localStorage.setItem('sp_my_orders', JSON.stringify(updated));
        } catch {}
      }
    };

    // Listen only to single canonical events
    socketInstance.on('order:created', handleCreated);
    socketInstance.on('order:updated', handleUpdated);

    setSocket(socketInstance);

    return () => {
      socketInstance.off('order:created', handleCreated);
      socketInstance.off('order:updated', handleUpdated);
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [wsUrl, user?.id, user?.role, queryClient, currentStoreId, addNotificationItem]);

  // Handle switching store rooms or joining admin room
  useEffect(() => {
    if (socket && isConnected && (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN')) {
      socket.emit('join:admin');
      if (currentStoreId) {
        socket.emit('join:store', currentStoreId);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['menu', currentStoreId] });
      }
    }
  }, [currentStoreId, socket, isConnected, queryClient, user?.role]);

  const trackOrder = useCallback(
    (orderId: string) => {
      if (!orderId) return;
      try {
        const stored: string[] = JSON.parse(localStorage.getItem('sp_tracked_orders') || '[]');
        if (!stored.includes(orderId)) {
          stored.push(orderId);
          localStorage.setItem('sp_tracked_orders', JSON.stringify(stored.slice(-20)));
        }
      } catch {}
      if (socket && isConnected) {
        socket.emit('join:order', orderId);
      }
    },
    [socket, isConnected]
  );

  const dismissPreparedOrder = useCallback(() => {
    setActivePreparedOrder(null);
  }, []);

  const clearNotification = () => setRecentNotification(null);

  const markAllAsRead = () => {
    persistNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    persistNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    persistNotifications(() => []);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      currentStoreId,
      setCurrentStoreId,
      recentNotification,
      clearNotification,
      notifications,
      unreadCount,
      markAllAsRead,
      clearAllNotifications,
      markAsRead,
      trackOrder,
      activePreparedOrder,
      dismissPreparedOrder,
    }),
    [
      socket,
      isConnected,
      currentStoreId,
      recentNotification,
      notifications,
      unreadCount,
      markAllAsRead,
      clearAllNotifications,
      markAsRead,
      trackOrder,
      activePreparedOrder,
      dismissPreparedOrder,
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useOrderSocket() {
  return useContext(SocketContext);
}
