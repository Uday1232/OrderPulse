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
        gap: { xs: 1.5, sm: 2 },
        py: { xs: 1.2, sm: 1.5 },
        px: { xs: 1.5, sm: 3 },
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      {/* Search Input Bar with Filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', md: 'auto' }, flex: { xs: '1 1 100%', md: '1 1 320px' }, maxWidth: { xs: '100%', md: 460 } }}>
        <TextField
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search food by name, ingredients..."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" sx={{ color: '#94A3B8' }}>
                  <TuneIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              fontSize: '0.875rem',
              color: '#1E293B',
              '& fieldset': { borderColor: '#E2E8F0' },
              '&:hover fieldset': { borderColor: '#CBD5E1' },
              '&.Mui-focused fieldset': { borderColor: '#FF7A00' },
            },
          }}
        />
      </Box>

      {/* Right Action Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
        {/* Store Location Dropdown */}
        <FormControl size="small" sx={{ minWidth: { xs: 'calc(100% - 100px)', sm: 180, md: 200 }, flex: { xs: 1, sm: 'none' } }}>
          <Select
            value={selectedStoreId || (stores[0]?.id || '')}
            onChange={(e) => onStoreChange(e.target.value)}
            displayEmpty
            sx={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              color: '#1E293B',
              fontWeight: 600,
              fontSize: '0.85rem',
              '& fieldset': { borderColor: '#E2E8F0' },
              '& .MuiSelect-select': { color: '#0F172A !important', py: 1 },
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
              width: { xs: 40, sm: 44 },
              height: { xs: 40, sm: 44 },
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
                  fontSize: '0.72rem',
                },
              }}
            >
              <ShoppingCartOutlinedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Best Offer Deals Button */}
        <Button
          onClick={onShowDeals}
          startIcon={<LocalFireDepartmentIcon sx={{ color: '#FFD700', fontSize: { xs: 16, sm: 18 } }} />}
          size="small"
          sx={{
            background: 'linear-gradient(135deg, #FF7A00 0%, #FFA800 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            borderRadius: '12px',
            px: { xs: 1.5, sm: 2 },
            py: { xs: 0.8, sm: 1 },
            boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            '&:hover': {
              background: 'linear-gradient(135deg, #E06500 0%, #FF9000 100%)',
              boxShadow: '0 6px 18px rgba(255, 122, 0, 0.45)',
            },
          }}
        >
          Deals
        </Button>

        {/* Dashboard Link for Admin (desktop only, mobile is in navbar drawer) */}
        {isAdmin && (
          <Button
            component={Link}
            href="/dashboard"
            startIcon={<DashboardIcon sx={{ fontSize: 18 }} />}
            sx={{
              display: { xs: 'none', lg: 'inline-flex' },
              borderRadius: '12px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 1.8,
              py: 0.9,
              '&:hover': { backgroundColor: '#1E293B' },
            }}
          >
            Admin Suite
          </Button>
        )}
      </Box>
    </Box>
  );
}
