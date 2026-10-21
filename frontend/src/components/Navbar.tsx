'use client';

import React, { useState } from 'react';
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
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import StoreIcon from '@mui/icons-material/Store';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArchiveIcon from '@mui/icons-material/Archive';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

import { useOrderSocket } from '../context/SocketContext';
import { useAuth } from '../hooks/useAuth';
import { NotificationPopover } from './NotificationPopover';

export function Navbar() {
  const pathname = usePathname();
  const { isConnected } = useOrderSocket();
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on login page, render clean minimal bar
  if (pathname === '/login') {
    return null;
  }

  // "My Orders" is exclusively for regular customer accounts, strictly not for store admins or superadmins
  const isCustomerOnly = Boolean(user && user.role === 'USER' && !isAdmin);

  const NAV_LINKS = isCustomerOnly
    ? [
        { label: 'My Orders', path: '/my-orders', icon: <ShoppingBagIcon sx={{ fontSize: 18 }} /> },
      ]
    : [];

  const ADMIN_LINKS = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
    { label: 'Orders List', path: '/orders', icon: <ViewListIcon sx={{ fontSize: 18 }} /> },
    { label: 'Menu Items', path: '/admin/menu', icon: <RestaurantMenuIcon sx={{ fontSize: 18 }} /> },
    { label: 'Stores', path: '/admin/stores', icon: <StoreIcon sx={{ fontSize: 18 }} /> },
    { label: 'Offers & Deals', path: '/admin/offers', icon: <LocalOfferIcon sx={{ fontSize: 18 }} /> },
    { label: 'Staff & Roles', path: '/admin/users', icon: <PeopleAltIcon sx={{ fontSize: 18 }} /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChartIcon sx={{ fontSize: 18 }} /> },
    { label: 'Archive', path: '/archive', icon: <ArchiveIcon sx={{ fontSize: 18 }} /> },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: '#0F172A',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2.5 } }}>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
            {/* Left: Mobile Menu Toggle + Brand Logo & Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <IconButton
                color="inherit"
                aria-label="open navigation menu"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  display: { xs: 'flex', lg: 'none' },
                  color: '#FFFFFF',
                  p: 0.8,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                }}
              >
                <MenuIcon sx={{ fontSize: 22 }} />
              </IconButton>

              <Box
                component={Link}
                href="/pos"
                sx={{
                  width: { xs: 34, sm: 38 },
                  height: { xs: 34, sm: 38 },
                  borderRadius: '10px',
                  backgroundColor: '#FF7A00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 10px rgba(255, 122, 0, 0.35)',
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                <PointOfSaleIcon sx={{ fontSize: { xs: 19, sm: 22 } }} />
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
                    fontSize: { xs: '1.05rem', sm: '1.2rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Store<span style={{ color: '#FF7A00' }}>Pulse</span>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94A3B8',
                    display: { xs: 'none', sm: 'block' },
                    mt: -0.4,
                    fontSize: '0.7rem',
                  }}
                >
                  POS & Multi-Store Platform
                </Typography>
              </Box>
            </Box>

            {/* Desktop Navigation Links */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.5 } }}>
              {/* Global Real-time Notification Popover */}
              <NotificationPopover
                buttonSx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  width: { xs: 34, sm: 38 },
                  height: { xs: 34, sm: 38 },
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                }}
                iconSx={{ fontSize: { xs: 18, sm: 20 } }}
              />

              {/* User Session Profile / Login */}
              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip
                    icon={<AccountCircleIcon sx={{ fontSize: '1rem !important' }} />}
                    label={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                          {user.name} ({user.role})
                        </Box>
                        <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                          {user.role}
                        </Box>
                      </Box>
                    }
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: '#E2E8F0',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 28,
                    }}
                  />
                  <Tooltip title="Log Out">
                    <IconButton size="small" onClick={logout} sx={{ color: '#94A3B8', p: 0.8, '&:hover': { color: '#EF4444' } }}>
                      <LogoutIcon sx={{ fontSize: 17 }} />
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
                    fontSize: '0.75rem',
                    px: { xs: 1.2, sm: 1.8 },
                    py: 0.4,
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

      {/* Mobile Slide-Out Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            p: 2,
          },
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: '#FF7A00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <PointOfSaleIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
              Store<span style={{ color: '#FF7A00' }}>Pulse</span>
            </Typography>
          </Box>
          <IconButton onClick={handleDrawerToggle} sx={{ color: '#94A3B8' }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 2 }} />

        {/* User Card inside Drawer */}
        {user ? (
          <Box sx={{ p: 1.5, borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
              {user.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
              {user.email}
            </Typography>
            <Chip
              label={user.role}
              size="small"
              sx={{
                backgroundColor: user.role === 'SUPERADMIN' ? '#3B82F6' : '#FF7A00',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 20,
              }}
            />
          </Box>
        ) : (
          <Button
            component={Link}
            href="/login"
            onClick={handleDrawerToggle}
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: '#FF7A00',
              color: '#FFFFFF',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              mb: 2,
              '&:hover': { backgroundColor: '#E06500' },
            }}
          >
            Sign In
          </Button>
        )}

        {/* Drawer Links */}
        {NAV_LINKS.length > 0 && (
          <>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, px: 1, letterSpacing: '0.08em' }}>
              CUSTOMER ACCOUNT
            </Typography>
            <List sx={{ mt: 0.5, mb: 2 }}>
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <ListItem key={link.path} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={link.path}
                      onClick={handleDrawerToggle}
                      sx={{
                        borderRadius: '10px',
                        backgroundColor: isActive ? 'rgba(255, 122, 0, 0.15)' : 'transparent',
                        color: isActive ? '#FF7A00' : '#E2E8F0',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive ? '#FF7A00' : '#94A3B8', minWidth: 36 }}>
                        {link.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={link.label}
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 700 : 500 }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}

        {/* Admin Navigation Links if logged in as Admin */}
        {isAdmin && (
          <>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, px: 1, letterSpacing: '0.08em' }}>
              ADMINISTRATION
            </Typography>
            <List sx={{ mt: 0.5 }}>
              {ADMIN_LINKS.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <ListItem key={link.path} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={link.path}
                      onClick={handleDrawerToggle}
                      sx={{
                        borderRadius: '10px',
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: isActive ? '#60A5FA' : '#CBD5E1',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive ? '#60A5FA' : '#94A3B8', minWidth: 36 }}>
                        {link.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={link.label}
                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 500 }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}

        {/* Drawer Footer */}
        {user && (
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 2 }} />
            <Button
              fullWidth
              startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
              onClick={() => {
                handleDrawerToggle();
                logout();
              }}
              sx={{
                color: '#F87171',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                justifyContent: 'flex-start',
                px: 2,
                '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
              }}
            >
              Sign Out
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  );
}
