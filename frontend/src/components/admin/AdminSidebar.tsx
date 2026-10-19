'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Typography, Button, Stack, Avatar, IconButton, Tooltip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArchiveIcon from '@mui/icons-material/Archive';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
  { label: 'Orders', path: '/orders', icon: <ViewListIcon sx={{ fontSize: 20 }} /> },
  { label: 'Create Order', path: '/pos', icon: <AddShoppingCartIcon sx={{ fontSize: 20 }} /> },
  { label: 'Stores', path: '/admin/stores', icon: <StoreIcon sx={{ fontSize: 20 }} /> },
  { label: 'Menu Items', path: '/admin/menu', icon: <RestaurantMenuIcon sx={{ fontSize: 20 }} /> },
  { label: 'Offers & Deals', path: '/admin/offers', icon: <LocalOfferIcon sx={{ fontSize: 20 }} /> },
  { label: 'Staff & Roles', path: '/admin/users', icon: <PeopleAltIcon sx={{ fontSize: 20 }} /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChartIcon sx={{ fontSize: 20 }} /> },
  { label: 'Archive', path: '/archive', icon: <ArchiveIcon sx={{ fontSize: 20 }} /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        backgroundColor: '#0F172A', // Dark Navy matching Image 2 sidebar
        color: '#FFFFFF',
        minHeight: 'calc(100vh - 70px)',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid #1E293B',
      }}
    >
      <Box>
        {/* Brand Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 3.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
            }}
          >
            <StorefrontIcon sx={{ fontSize: 22, color: '#FFFFFF' }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              StorePulse
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              Management Suite
            </Typography>
          </Box>
        </Box>

        {/* Navigation Items */}
        <Stack spacing={0.8}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path || (item.path === '/orders' && pathname.startsWith('/orders/'));

            return (
              <Button
                key={item.label}
                component={Link}
                href={item.path}
                startIcon={item.icon}
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.1,
                  borderRadius: '12px',
                  backgroundColor: isActive ? '#1E293B' : 'transparent',
                  color: isActive ? '#38BDF8' : '#94A3B8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  borderLeft: isActive ? '3px solid #38BDF8' : '3px solid transparent',
                  '&:hover': {
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>
      </Box>

      {/* User Session Footer */}
      <Box
        sx={{
          pt: 2,
          borderTop: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              backgroundColor: '#3B82F6',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {user ? user.name[0] : 'A'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              {user ? user.name : 'Admin'}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: '#64748B', display: 'block' }}>
              {user ? user.role : 'ADMIN'}
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Log Out">
          <IconButton size="small" onClick={logout} sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
            <LogoutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
