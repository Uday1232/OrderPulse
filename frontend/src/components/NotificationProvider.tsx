'use client';

import React, { useEffect } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { useOrderSocket } from '../context/SocketContext';
import { useAuthStore } from '../store/useAuthStore';
import { playChime } from '../utils/audio';

function SocketNotificationListener() {
  const { socket, isConnected } = useOrderSocket();
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!socket) return;

    // Listen for new orders
    const handleNewOrder = (order: { id: string; total_amount?: number; items?: Array<{ name: string; qty: number }> }) => {
      // Audible chime
      playChime('alert');

      if (isAdmin) {
        enqueueSnackbar(`🔔 New Order #${order.id.slice(0, 8)} received ($${Number(order.total_amount || 0).toFixed(2)})`, {
          variant: 'success',
          autoHideDuration: 6000,
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
      }
    };

    // Listen for status updates
    const handleStatusUpdate = (order: { id: string; status: string; user_id?: string | null }) => {
      const orderShortId = order.id.slice(0, 8);

      if (order.status === 'PREPARED') {
        playChime('success');
        enqueueSnackbar(`✨ Order #${orderShortId} is now PREPARED and ready for pickup/serving!`, {
          variant: 'success',
          autoHideDuration: 7000,
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
      } else if (order.status === 'CANCELLED') {
        enqueueSnackbar(`⚠️ Order #${orderShortId} has been CANCELLED.`, {
          variant: 'error',
          autoHideDuration: 6000,
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
      } else if (order.status === 'PLACED') {
        enqueueSnackbar(`📋 Order #${orderShortId} status updated to PLACED`, {
          variant: 'info',
          autoHideDuration: 4000,
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order:created', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('order:updated', handleStatusUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order:created', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('order:updated', handleStatusUpdate);
    };
  }, [socket, enqueueSnackbar, isAdmin, user]);

  return null;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={4}
      autoHideDuration={5000}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <SocketNotificationListener />
      {children}
    </SnackbarProvider>
  );
}
