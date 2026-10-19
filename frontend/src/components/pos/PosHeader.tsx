'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Button,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';

import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useStores } from '../../hooks/useStores';
import { NotificationPopover } from '../NotificationPopover';

interface PosHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
  onOpenCheckout: () => void;
  onShowDeals: () => void;
}

export function PosHeader({
  searchValue,
  onSearchChange,
  selectedStoreId,
  onStoreChange,
  onOpenCheckout,
  onShowDeals,
}: PosHeaderProps) {
  const totalCartCount = useCartStore((s) => s.getTotalCount());
  const { user, isAdmin } = useAuthStore();
  const { stores } = useStores();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        py: 1.5,
        px: 3,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      {/* Search Input Bar with Filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 320px', maxWidth: 460 }}>
        <TextField
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search By Food Name.."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94A3B8' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" sx={{ color: '#94A3B8' }}>
                  <TuneIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              backgroundColor: '#F8FAFC',
              borderRadius: '14px',
              fontSize: '0.9rem',
              color: '#1E293B',
              '& fieldset': { borderColor: '#E2E8F0' },
              '&:hover fieldset': { borderColor: '#CBD5E1' },
              '&.Mui-focused fieldset': { borderColor: '#FF7A00' },
            },
          }}
        />
      </Box>

      {/* Right Action Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {/* Store Location Dropdown */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={selectedStoreId || (stores[0]?.id || '')}
            onChange={(e) => onStoreChange(e.target.value)}
            displayEmpty
            sx={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              color: '#1E293B',
              fontWeight: 600,
              fontSize: '0.875rem',
              '& fieldset': { borderColor: '#E2E8F0' },
              '& .MuiSelect-select': { color: '#0F172A !important' },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                },
              },
            }}
          >
            {stores.map((s) => {
              const isActive = s.is_active !== false;
              return (
                <MenuItem key={s.id} value={s.id} disabled={!isActive && !isAdmin}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ fontSize: 18, color: isActive ? '#FF7A00' : '#94A3B8' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isActive ? '#0F172A' : '#94A3B8' }}>
                        {s.name}
                      </Typography>
                    </Box>
                    {!isActive && (
                      <Chip
                        label="Inactive"
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 18, backgroundColor: '#F1F5F9', color: '#64748B' }}
                      />
                    )}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {/* Cart Icon Badge */}
        <Tooltip title="View Cart / Checkout">
          <IconButton
            onClick={onOpenCheckout}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#1E293B',
              '&:hover': { backgroundColor: '#F1F5F9' },
            }}
          >
            <Badge
              badgeContent={totalCartCount}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                },
              }}
            >
              <ShoppingCartOutlinedIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Notification Bell Popover */}
        <NotificationPopover />

        {/* Best Offer Deals Button */}
        <Button
          onClick={onShowDeals}
          startIcon={<LocalFireDepartmentIcon sx={{ color: '#FFD700' }} />}
          sx={{
            background: 'linear-gradient(135deg, #FF7A00 0%, #FFA800 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.85rem',
            borderRadius: '14px',
            px: 2.2,
            py: 1.1,
            boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #E06500 0%, #FF9000 100%)',
              boxShadow: '0 6px 18px rgba(255, 122, 0, 0.45)',
            },
          }}
        >
          Best Offer Deals <span style={{ opacity: 0.8, fontSize: '0.75rem', marginLeft: 4 }}>(Click)</span>
        </Button>

        {/* Dashboard Link for Admin */}
        {isAdmin && (
          <Button
            component={Link}
            href="/dashboard"
            startIcon={<DashboardIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: '12px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 1.8,
              py: 1,
              '&:hover': { backgroundColor: '#1E293B' },
            }}
          >
            Admin Suite
          </Button>
        )}

        {/* User / Login Status */}
        <Button
          component={Link}
          href="/login"
          startIcon={<AccountCircleIcon />}
          sx={{
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            color: '#475569',
            fontSize: '0.85rem',
            fontWeight: 600,
            px: 1.8,
            py: 0.9,
            backgroundColor: '#F8FAFC',
            '&:hover': { backgroundColor: '#F1F5F9' },
          }}
        >
          {user ? user.name : 'Sign In'}
        </Button>
      </Box>
    </Box>
  );
}
