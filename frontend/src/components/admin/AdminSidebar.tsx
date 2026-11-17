'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Typography, Button, Stack, Avatar, IconButton, Tooltip, Chip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ArchiveIcon from '@mui/icons-material/Archive';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

import { useAuth } from '../../hooks/useAuth';
import { UserProfileDialog } from '../profile/UserProfileDialog';

const NAV_ITEMS = [
  { label: 'Analytics Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
  { label: 'Orders', path: '/orders', icon: <ViewListIcon sx={{ fontSize: 20 }} /> },
  { label: 'Create Order', path: '/pos', icon: <AddShoppingCartIcon sx={{ fontSize: 20 }} /> },
  { label: 'Menu Items', path: '/admin/menu', icon: <RestaurantMenuIcon sx={{ fontSize: 20 }} /> },
  { label: 'Offers & Deals', path: '/admin/offers', icon: <LocalOfferIcon sx={{ fontSize: 20 }} /> },
  { label: 'Stores', path: '/admin/stores', icon: <StoreIcon sx={{ fontSize: 20 }} /> },
  { label: 'Staff & Roles', path: '/admin/users', icon: <PeopleAltIcon sx={{ fontSize: 20 }} /> },
  { label: 'Archive', path: '/archive', icon: <ArchiveIcon sx={{ fontSize: 20 }} /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = user?.name?.trim() ? user.name : (user?.role || 'Admin');
  const userInitial = displayName.charAt(0).toUpperCase() || 'A';

  return (
    <>
      {/* Desktop Placeholder Spacer (reserves exact 250px space so page content is positioned cleanly without jumping) */}
      <Box
        sx={{
          width: 250,
          minWidth: 250,
          maxWidth: 250,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
        }}
      />

      {/* 1. Desktop Fixed Sidebar (permanently pinned to viewport; does not scroll or move) */}
      <Box
        sx={{
          width: 250,
          minWidth: 250,
          maxWidth: 250,
          position: 'fixed',
          top: { xs: '56px', sm: '64px' },
          left: 0,
          bottom: 0,
          height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: { xs: 'none', md: 'flex' },
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          p: 2,
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #1E293B',
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        {/* Navigation Items (Scrollable independently if viewport height is restricted) */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            pr: 0.5,
            display: 'flex',
            flexDirection: 'column',
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' },
          }}
        >
          <Stack spacing={0.6}>
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
                    px: 1.6,
                    py: 1,
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    color: isActive ? '#38BDF8' : '#94A3B8',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.86rem',
                    borderLeft: isActive ? '3px solid #38BDF8' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#1E293B',
                      color: '#FFFFFF',
                    },
                    '& .MuiButton-startIcon': {
                      color: isActive ? '#38BDF8' : '#64748B',
                      transition: 'color 0.15s ease',
                      mr: 1.2,
                    },
                    '&:hover .MuiButton-startIcon': {
                      color: '#38BDF8',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>
        </Box>

        {/* User Session Footer (Pinned at bottom) */}
        <Box
          sx={{
            pt: 1.5,
            mt: 1,
            borderTop: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <Box
            onClick={() => setProfileOpen(true)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              minWidth: 0,
              cursor: 'pointer',
              p: 0.6,
              borderRadius: '8px',
              transition: 'all 0.2s',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                backgroundColor: '#3B82F6',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              {userInitial}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.84rem' }}>
                {displayName}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
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

      {/* User Profile Dialog */}
      <UserProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* 2. Mobile Horizontal Quick-Navigation Bar */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
          py: 1,
          px: 1.5,
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            overflowX: 'auto',
            gap: 1,
            py: 0.5,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path || (item.path === '/orders' && pathname.startsWith('/orders/'));
            return (
              <Chip
                key={item.label}
                icon={item.icon}
                label={item.label}
                component={Link}
                href={item.path}
                clickable
                sx={{
                  backgroundColor: isActive ? '#3B82F6' : '#1E293B',
                  color: isActive ? '#FFFFFF !important' : '#94A3B8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.78rem',
                  borderRadius: '10px',
                  px: 0.5,
                  py: 1.8,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  '& .MuiChip-icon': {
                    color: isActive ? '#FFFFFF !important' : '#94A3B8 !important',
                    fontSize: '1rem',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>
    </>
  );
}
