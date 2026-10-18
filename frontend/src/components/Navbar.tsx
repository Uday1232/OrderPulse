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
  Select,
  MenuItem,
  FormControl,
  Chip,
  Container,
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ViewListIcon from '@mui/icons-material/ViewList';
import BarChartIcon from '@mui/icons-material/BarChart';
import UpdateIcon from '@mui/icons-material/Update';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useOrderSocket } from '../context/SocketContext';
import { AVAILABLE_STORES } from '../types/order';

export function Navbar() {
  const pathname = usePathname();
  const { currentStoreId, setCurrentStoreId, isConnected } = useOrderSocket();

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 70 }}>
          {/* Brand Logo & Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}
            >
              <RestaurantMenuIcon />
            </Box>
            <Box>
              <Typography
                variant="h6"
                component={Link}
                href="/"
                sx={{
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '1.25rem',
                }}
              >
                TMBill <span style={{ color: '#F59E0B' }}>OrderOS</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mt: -0.5 }}>
                Multi-Store Real-Time Management
              </Typography>
            </Box>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Button
              component={Link}
              href="/"
              startIcon={<ViewListIcon />}
              sx={{
                color: pathname === '/' ? '#F59E0B' : '#E5E7EB',
                backgroundColor: pathname === '/' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                border: pathname === '/' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid transparent',
              }}
            >
              Orders List
            </Button>
            <Button
              component={Link}
              href="/create-order"
              startIcon={<AddCircleOutlineIcon />}
              sx={{
                color: pathname === '/create-order' ? '#F59E0B' : '#E5E7EB',
                backgroundColor: pathname === '/create-order' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                border: pathname === '/create-order' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid transparent',
              }}
            >
              New Order
            </Button>
            <Button
              component={Link}
              href="/update-order-status"
              startIcon={<UpdateIcon />}
              sx={{
                color: pathname === '/update-order-status' ? '#F59E0B' : '#E5E7EB',
                backgroundColor: pathname === '/update-order-status' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                border: pathname === '/update-order-status' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid transparent',
              }}
            >
              Update Status
            </Button>
            <Button
              component={Link}
              href="/analytics"
              startIcon={<BarChartIcon />}
              sx={{
                color: pathname === '/analytics' ? '#F59E0B' : '#E5E7EB',
                backgroundColor: pathname === '/analytics' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                border: pathname === '/analytics' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid transparent',
              }}
            >
              Analytics & Archival
            </Button>
          </Box>

          {/* Right Controls: Store Switcher & Real-time Live Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Store Selector */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={currentStoreId}
                onChange={(e) => setCurrentStoreId(e.target.value)}
                displayEmpty
                renderValue={(selected) => {
                  const store = AVAILABLE_STORES.find((s) => s.id === selected);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ fontSize: '1.1rem', color: '#F59E0B' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {store?.name || selected}
                      </Typography>
                    </Box>
                  );
                }}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  fontSize: '0.875rem',
                }}
              >
                {AVAILABLE_STORES.map((store) => (
                  <MenuItem key={store.id} value={store.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {store.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                        {store.location}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Socket Live Pulse Indicator */}
            <Chip
              icon={
                <FiberManualRecordIcon
                  sx={{
                    fontSize: '0.75rem !important',
                    color: isConnected ? '#10B981 !important' : '#EF4444 !important',
                    animation: isConnected ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
              }
              label={isConnected ? 'LIVE' : 'OFFLINE'}
              size="small"
              sx={{
                backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isConnected ? '#34D399' : '#F87171',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                px: 0.5,
              }}
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
