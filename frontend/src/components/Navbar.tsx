'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Tooltip,
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import StoreIcon from '@mui/icons-material/Store';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArchiveIcon from '@mui/icons-material/Archive';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

import { useOrderSocket } from '../context/SocketContext';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const pathname = usePathname();
  const { isConnected } = useOrderSocket();
  const { user, isAdmin, logout } = useAuth();

  // If on login page, render clean minimal bar
  if (pathname === '/login') {
    return null;
  }

  const NAV_LINKS = [
    { label: 'POS Terminal', path: '/pos', icon: <PointOfSaleIcon sx={{ fontSize: 18 }} /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
    { label: 'Orders', path: '/orders', icon: <ViewListIcon sx={{ fontSize: 18 }} /> },
    { label: 'Stores', path: '/admin/stores', icon: <StoreIcon sx={{ fontSize: 18 }} /> },
    { label: 'Menu Items', path: '/admin/menu', icon: <RestaurantMenuIcon sx={{ fontSize: 18 }} /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChartIcon sx={{ fontSize: 18 }} /> },
    { label: 'Archive', path: '/archive', icon: <ArchiveIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: '#0F172A',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 64 }}>
          {/* Brand Logo & Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: '#FF7A00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(255, 122, 0, 0.35)',
              }}
            >
              <PointOfSaleIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                component={Link}
                href="/pos"
                sx={{
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '1.2rem',
                }}
              >
                Store<span style={{ color: '#FF7A00' }}>Pulse</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: -0.6, fontSize: '0.7rem' }}>
                POS & Multi-Store Platform
              </Typography>
            </Box>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.8 }}>
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.path || (link.path === '/pos' && pathname === '/');

              return (
                <Button
                  key={link.path}
                  component={Link}
                  href={link.path}
                  startIcon={link.icon}
                  size="small"
                  sx={{
                    color: isActive ? '#FF7A00' : '#CBD5E1',
                    backgroundColor: isActive ? 'rgba(255, 122, 0, 0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(255, 122, 0, 0.3)' : '1px solid transparent',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.825rem',
                    borderRadius: '8px',
                    px: 1.4,
                    py: 0.7,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </Box>

          {/* Right Controls: Real-time Socket Indicator & User */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Socket Live Pulse Indicator */}
            <Chip
              icon={
                <FiberManualRecordIcon
                  sx={{
                    fontSize: '0.7rem !important',
                    color: isConnected ? '#10B981 !important' : '#EF4444 !important',
                  }}
                />
              }
              label={isConnected ? 'LIVE' : 'OFFLINE'}
              size="small"
              sx={{
                backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: isConnected ? '#34D399' : '#F87171',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.04em',
                px: 0.5,
              }}
            />

            {/* User Session Profile / Login */}
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<AccountCircleIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`${user.name} (${user.role})`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#E2E8F0',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                />
                <Tooltip title="Log Out">
                  <IconButton size="small" onClick={logout} sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                    <LogoutIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  px: 1.8,
                  '&:hover': { borderColor: '#FF7A00', color: '#FF7A00' },
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
