'use client';

import React from 'react';
import { Snackbar, Alert, Typography, Box } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { useOrderSocket } from '../context/SocketContext';

export function RealtimeAlert() {
  const { recentNotification, clearNotification } = useOrderSocket();

  if (!recentNotification) return null;

  const isCreated = recentNotification.type === 'created';

  return (
    <Snackbar
      open={Boolean(recentNotification)}
      autoHideDuration={5000}
      onClose={clearNotification}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={clearNotification}
        severity={isCreated ? 'success' : 'info'}
        icon={<BoltIcon sx={{ color: isCreated ? '#10B981' : '#3B82F6' }} />}
        sx={{
          backgroundColor: '#1E293B',
          color: '#F8FAFC',
          border: `1px solid ${isCreated ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          alignItems: 'center',
          '& .MuiAlert-message': {
            padding: '4px 0',
          },
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: isCreated ? '#34D399' : '#60A5FA' }}>
            {isCreated ? '⚡ Real-Time New Order' : '⚡ Order Status Updated'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
            {recentNotification.message}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
}
