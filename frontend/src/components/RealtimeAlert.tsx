'use client';

import React from 'react';
import { Snackbar, Alert, Typography, Box } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { useOrderSocket } from '../context/SocketContext';

export function RealtimeAlert() {
  const { recentNotification, clearNotification } = useOrderSocket();

  if (!recentNotification) return null;

  const isCreated = recentNotification.type === 'created';
  const isPrepared = recentNotification.order?.status === 'PREPARED';

  return (
    <Snackbar
      open={Boolean(recentNotification)}
      autoHideDuration={isPrepared ? 8000 : 5000}
      onClose={clearNotification}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={clearNotification}
        severity={isCreated || isPrepared ? 'success' : 'info'}
        icon={<BoltIcon sx={{ color: isPrepared ? '#34D399' : isCreated ? '#10B981' : '#3B82F6' }} />}
        sx={{
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          border: `1px solid ${isPrepared ? 'rgba(52, 211, 153, 0.6)' : isCreated ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          alignItems: 'center',
          '& .MuiAlert-message': {
            padding: '4px 0',
          },
        }}
      >
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 800,
              color: isPrepared ? '#34D399' : isCreated ? '#10B981' : '#60A5FA',
            }}
          >
            {isPrepared
              ? '🍽️ Order Ready for Pickup!'
              : isCreated
              ? '⚡ Real-Time New Order'
              : '⚡ Order Status Updated'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mt: 0.2 }}>
            {recentNotification.message}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
}
