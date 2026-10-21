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
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useStores } from '../../hooks/useStores';

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
  const totalCartAmount = useCartStore((s) => s.getTotalAmount());
  const { isAdmin } = useAuthStore();
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', md: 'auto' }, flex: { xs: '1 1 100%', md: '1 1 320px' }, maxWidth: { xs: '100%', md: 440 } }}>
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
        {/* Interactive & Highly Visible Store Location Dropdown */}
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 240, md: 270 }, flex: { xs: 1, sm: 'none' } }}>
          <Select
            value={selectedStoreId || (stores[0]?.id || '')}
            onChange={(e) => onStoreChange(e.target.value)}
            displayEmpty
            renderValue={(selectedId) => {
              const curStore = stores.find((s) => s.id === selectedId) || stores[0];
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, textAlign: 'left', py: 0.2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      backgroundColor: '#FFEDD5',
                      color: '#EA580C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <StorefrontIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.86rem', letterSpacing: '-0.01em' }}
                      >
                        {curStore?.name || 'Select Store'}
                      </Typography>
                      <Chip
                        label="Active"
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          borderRadius: '4px',
                          '& .MuiChip-label': { px: 0.6 },
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem', fontWeight: 600 }}
                    >
                      📍 {curStore?.location || 'Store Branch'}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            sx={{
              backgroundColor: '#FFF7ED',
              border: '1.5px solid #FDBA74',
              borderRadius: '12px',
              color: '#1E293B',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#EA580C',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.15)',
              },
              '& .MuiSelect-select': { color: '#0F172A !important', py: 0.6, px: 1.2 },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiSvgIcon-root': { color: '#EA580C' },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  borderRadius: '14px',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                  mt: 1,
                  maxHeight: 420,
                  '& .MuiList-root': { py: 1 },
                },
              },
            }}
          >
            {/* Header banner inside menu */}
            <Box sx={{ px: 2, py: 1.2, borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <StorefrontIcon sx={{ fontSize: 16, color: '#EA580C' }} />
                Select Restaurant Branch ({stores.length} Available)
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem', display: 'block', mt: 0.2 }}>
                Dishes, prices, and active kitchen queue update dynamically
              </Typography>
            </Box>

            {stores.map((s) => {
              const isSelected = s.id === (selectedStoreId || stores[0]?.id);
              const isActive = s.is_active !== false;

              return (
                <MenuItem
                  key={s.id}
                  value={s.id}
                  disabled={!isActive && !isAdmin}
                  sx={{
                    py: 1.2,
                    px: 2,
                    my: 0.4,
                    mx: 0.8,
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                    border: isSelected ? '1px solid #BFDBFE' : '1px solid transparent',
                    '&:hover': {
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFF7ED',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#3B82F6' : '#FFEDD5',
                          color: isSelected ? '#FFFFFF' : '#EA580C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <StorefrontIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 800 : 700, color: '#0F172A', fontSize: '0.88rem' }}>
                          {s.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
                          📍 {s.location || 'Branch Kitchen'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      {isSelected ? (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#1D4ED8 !important' }} />}
                          label="Selected"
                          size="small"
                          sx={{
                            height: 22,
                            backgroundColor: '#DBEAFE',
                            color: '#1D4ED8',
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            borderRadius: '6px',
                          }}
                        />
                      ) : isActive ? (
                        <Chip
                          label="Open Now"
                          size="small"
                          sx={{
                            height: 20,
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            borderRadius: '6px',
                          }}
                        />
                      ) : (
                        <Chip
                          label="Inactive"
                          size="small"
                          sx={{
                            height: 20,
                            backgroundColor: '#F1F5F9',
                            color: '#64748B',
                            fontWeight: 600,
                            fontSize: '0.68rem',
                            borderRadius: '6px',
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {/* Highlighted Interactive Cart Button */}
        <Button
          onClick={onOpenCheckout}
          id="pos-cart-button"
          startIcon={
            <Badge
              badgeContent={totalCartCount}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                },
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 22, color: totalCartCount > 0 ? '#FFFFFF' : '#0F172A' }} />
            </Badge>
          }
          sx={{
            background: totalCartCount > 0
              ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
              : '#FFFFFF',
            color: totalCartCount > 0 ? '#FFFFFF' : '#0F172A',
            border: totalCartCount > 0 ? '1.5px solid #059669' : '2px solid #0F172A',
            borderRadius: '12px',
            px: { xs: 1.8, sm: 2.2 },
            py: { xs: 0.8, sm: 1 },
            fontWeight: 800,
            fontSize: { xs: '0.82rem', sm: '0.88rem' },
            textTransform: 'none',
            whiteSpace: 'nowrap',
            boxShadow: totalCartCount > 0
              ? '0 4px 16px rgba(16, 185, 129, 0.4), 0 0 0 2px rgba(16, 185, 129, 0.2)'
              : '0 2px 8px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: totalCartCount > 0
                ? 'linear-gradient(135deg, #047857 0%, #059669 100%)'
                : '#0F172A',
              color: '#FFFFFF',
              transform: 'translateY(-1px)',
              boxShadow: totalCartCount > 0
                ? '0 6px 20px rgba(16, 185, 129, 0.55)'
                : '0 4px 14px rgba(15, 23, 42, 0.25)',
              '& .MuiSvgIcon-root': {
                color: '#FFFFFF',
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: { xs: '0.82rem', sm: '0.88rem' } }}>
              Cart
            </Typography>
            {totalCartCount > 0 && totalCartAmount > 0 && (
              <Chip
                label={`₹${totalCartAmount.toFixed(0)}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  height: 22,
                  borderRadius: '6px',
                }}
              />
            )}
          </Box>
        </Button>

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
