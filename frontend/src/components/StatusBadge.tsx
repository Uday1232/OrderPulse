'use client';

import React from 'react';
import { Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OutdoorGrillIcon from '@mui/icons-material/OutdoorGrill';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { OrderStatus } from '../types/order';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'small' | 'medium';
}

export function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  switch (status) {
    case 'PLACED':
      return (
        <Chip
          icon={<AccessTimeIcon sx={{ fontSize: '1rem !important', color: '#F59E0B !important' }} />}
          label="Placed"
          size={size}
          sx={{
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#FBBF24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontWeight: 700,
          }}
        />
      );
    case 'PREPARING':
      return (
        <Chip
          icon={<OutdoorGrillIcon sx={{ fontSize: '1rem !important', color: '#3B82F6 !important' }} />}
          label="Preparing"
          size={size}
          sx={{
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: '#60A5FA',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontWeight: 700,
          }}
        />
      );
    case 'PREPARED':
    case 'COMPLETED':
      return (
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: '1rem !important', color: '#10B981 !important' }} />}
          label="Prepared"
          size={size}
          sx={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#34D399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontWeight: 700,
          }}
        />
      );
    case 'PENDING':
      return (
        <Chip
          icon={<AccessTimeIcon sx={{ fontSize: '1rem !important', color: '#F59E0B !important' }} />}
          label="Pending"
          size={size}
          sx={{
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#FBBF24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontWeight: 700,
          }}
        />
      );
    case 'CANCELLED':
      return (
        <Chip
          label="Cancelled"
          size={size}
          sx={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#F87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontWeight: 700,
          }}
        />
      );
    default:
      return <Chip label={status} size={size} />;
  }
}
