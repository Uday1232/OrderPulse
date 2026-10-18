'use client';

import React, { useState } from 'react';
import {
  Button,
  ButtonGroup,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { OrderStatus } from '../types/order';

interface StatusTransitionProps {
  orderId: string;
  currentStatus: OrderStatus;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

export function StatusTransitionMenu({
  orderId,
  currentStatus,
  onUpdateStatus,
}: StatusTransitionProps) {
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleQuickTransition = async () => {
    let nextStatus: OrderStatus = 'PREPARED';
    if (currentStatus === 'PLACED' || currentStatus === 'PENDING') nextStatus = 'PREPARED';
    else if (currentStatus === 'PREPARED' || currentStatus === 'COMPLETED') return;
    else return;

    setLoading(true);
    try {
      await onUpdateStatus(orderId, nextStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStatus = async (status: OrderStatus) => {
    setAnchorEl(null);
    if (status === currentStatus) return;

    setLoading(true);
    try {
      await onUpdateStatus(orderId, status);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = currentStatus === 'PREPARED' || currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED';

  return (
    <>
      <ButtonGroup
        size="small"
        variant="outlined"
        disabled={loading}
        sx={{
          borderRadius: 2,
          borderColor: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        <Button
          onClick={handleQuickTransition}
          disabled={loading || isCompleted}
          startIcon={
            loading ? (
              <CircularProgress size={14} color="inherit" />
            ) : currentStatus === 'PLACED' ? (
              <PlayArrowIcon sx={{ fontSize: '1rem', color: '#60A5FA' }} />
            ) : currentStatus === 'PREPARED' ? (
              <CheckIcon sx={{ fontSize: '1rem', color: '#34D399' }} />
            ) : (
              <DoneAllIcon sx={{ fontSize: '1rem', color: '#9CA3AF' }} />
            )
          }
          sx={{
            px: 1.5,
            py: 0.5,
            fontSize: '0.8125rem',
            color: isCompleted ? '#9CA3AF' : '#F3F4F6',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          {loading
            ? 'Updating...'
            : currentStatus === 'PLACED'
            ? 'Mark Prepared'
            : currentStatus === 'PREPARED'
            ? 'Prepared'
            : currentStatus}
        </Button>
        <Button
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            px: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          <ArrowDropDownIcon fontSize="small" />
        </Button>
      </ButtonGroup>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <MenuItem
          onClick={() => handleSelectStatus('PLACED')}
          selected={currentStatus === 'PLACED'}
          sx={{ fontSize: '0.85rem' }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: '#3B82F6' }}>•</ListItemIcon>
          <ListItemText primary="Set to Placed" />
        </MenuItem>
        <MenuItem
          onClick={() => handleSelectStatus('PREPARED')}
          selected={currentStatus === 'PREPARED'}
          sx={{ fontSize: '0.85rem' }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: '#10B981' }}>•</ListItemIcon>
          <ListItemText primary="Set to Prepared" />
        </MenuItem>
        <MenuItem
          onClick={() => handleSelectStatus('PENDING')}
          selected={currentStatus === 'PENDING'}
          sx={{ fontSize: '0.85rem' }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: '#F59E0B' }}>•</ListItemIcon>
          <ListItemText primary="Set to Pending" />
        </MenuItem>
        <MenuItem
          onClick={() => handleSelectStatus('CANCELLED')}
          selected={currentStatus === 'CANCELLED'}
          sx={{ fontSize: '0.85rem', color: '#EF4444' }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: '#EF4444' }}>•</ListItemIcon>
          <ListItemText primary="Set to Cancelled" />
        </MenuItem>
      </Menu>
    </>
  );
}
