'use client';

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  Button,
  Divider,
  Stack,
  Chip,
  Avatar,
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import { useOrderSocket, SocketNotificationItem } from '../context/SocketContext';

interface NotificationPopoverProps {
  buttonSx?: object;
  iconSx?: object;
}

export function NotificationPopover({ buttonSx, iconSx }: NotificationPopoverProps) {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearAllNotifications,
    markAsRead,
  } = useOrderSocket();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getItemIcon = (item: SocketNotificationItem) => {
    if (item.status === 'PREPARED') {
      return (
        <Avatar sx={{ width: 34, height: 34, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
        </Avatar>
      );
    }
    if (item.status === 'CANCELLED') {
      return (
        <Avatar sx={{ width: 34, height: 34, backgroundColor: '#FEE2E2', color: '#DC2626' }}>
          <CancelOutlinedIcon sx={{ fontSize: 20 }} />
        </Avatar>
      );
    }
    if (item.type === 'created') {
      return (
        <Avatar sx={{ width: 34, height: 34, backgroundColor: '#FFEDD5', color: '#EA580C' }}>
          <ShoppingBagOutlinedIcon sx={{ fontSize: 20 }} />
        </Avatar>
      );
    }
    return (
      <Avatar sx={{ width: 34, height: 34, backgroundColor: '#DBEAFE', color: '#2563EB' }}>
        <HourglassEmptyIcon sx={{ fontSize: 20 }} />
      </Avatar>
    );
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          color: '#1E293B',
          '&:hover': { backgroundColor: '#F1F5F9' },
          ...buttonSx,
        }}
        title="Live Order Notifications"
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.72rem',
            },
          }}
        >
          {unreadCount > 0 ? (
            <NotificationsActiveIcon sx={{ fontSize: 22, color: '#FF7A00', ...iconSx }} />
          ) : (
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 22, ...iconSx }} />
          )}
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 380,
            maxWidth: '92vw',
            borderRadius: '16px',
            boxShadow: '0 12px 35px rgba(15, 23, 42, 0.16)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            mt: 1.5,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            px: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F5F9',
            backgroundColor: '#FAFAFA',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} New`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#3B82F6',
                  textTransform: 'none',
                  p: '2px 6px',
                }}
              >
                Mark read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                size="small"
                onClick={clearAllNotifications}
                startIcon={<DeleteSweepIcon sx={{ fontSize: 16 }} />}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#94A3B8',
                  textTransform: 'none',
                  p: '2px 6px',
                  '&:hover': { color: '#EF4444' },
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        {/* Notifications Body */}
        <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#94A3B8' }}>
              <NotificationsNoneOutlinedIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                All caught up!
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                Real-time orders and status changes will appear here instantly.
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Divider sx={{ borderColor: '#F8FAFC' }} />}>
              {notifications.map((item) => (
                <Box
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  sx={{
                    p: 1.8,
                    px: 2.2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    cursor: 'pointer',
                    backgroundColor: item.read ? '#FFFFFF' : '#F0F9FF',
                    transition: 'background-color 0.2s',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: item.read ? '#F8FAFC' : '#E0F2FE',
                    },
                  }}
                >
                  {/* Status Avatar */}
                  {getItemIcon(item)}

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: item.read ? 600 : 800,
                          color: '#0F172A',
                          fontSize: '0.825rem',
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                        {formatTime(item.timestamp)}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        color: '#475569',
                        display: 'block',
                        lineHeight: 1.35,
                        fontSize: '0.75rem',
                      }}
                    >
                      {item.message}
                    </Typography>

                    {item.totalAmount !== undefined && item.totalAmount > 0 && (
                      <Chip
                        label={`$${item.totalAmount.toFixed(2)}`}
                        size="small"
                        sx={{
                          mt: 0.8,
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                        }}
                      />
                    )}
                  </Box>

                  {/* Unread indicator dot */}
                  {!item.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#3B82F6',
                        mt: 0.8,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Popover>
    </>
  );
}
