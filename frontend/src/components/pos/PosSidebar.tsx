'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
  Collapse,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import CoffeeIcon from '@mui/icons-material/Coffee';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TuneIcon from '@mui/icons-material/Tune';
import PersonIcon from '@mui/icons-material/Person';

import { useAuth } from '../../hooks/useAuth';
import { useStores } from '../../hooks/useStores';
import { UserProfileDialog } from '../profile/UserProfileDialog';

interface PosSidebarProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  selectedStoreId?: string;
  onSelectStore?: (storeId: string) => void;
  selectedPriceRange?: string;
  onSelectPriceRange?: (range: string) => void;
  inStockOnly?: boolean;
  onToggleInStockOnly?: (value: boolean) => void;
  onResetFilters?: () => void;
  onOpenDeals?: () => void;
}

const CATEGORY_ITEMS = [
  { id: 'all', label: 'All Categories', icon: <RestaurantIcon sx={{ fontSize: 17 }} /> },
  { id: 'veg-mania', label: 'Veg. Mania', icon: <LunchDiningIcon sx={{ fontSize: 17 }} /> },
  { id: 'sandwich', label: 'Sandwich', icon: <FastfoodIcon sx={{ fontSize: 17 }} /> },
  { id: 'pizza', label: 'Veg. Pizza', icon: <LocalPizzaIcon sx={{ fontSize: 17 }} /> },
  { id: 'burger', label: 'Burger', icon: <LunchDiningIcon sx={{ fontSize: 17 }} /> },
  { id: 'french-fries', label: 'French Fries', icon: <FastfoodIcon sx={{ fontSize: 17 }} /> },
  { id: 'macaroni', label: 'Macaroni', icon: <SoupKitchenIcon sx={{ fontSize: 17 }} /> },
  { id: 'hot-coffee', label: 'Hot-Coffee', icon: <CoffeeIcon sx={{ fontSize: 17 }} /> },
  { id: 'ice-tea', label: 'Ice-Tea', icon: <LocalCafeIcon sx={{ fontSize: 17 }} /> },
];

const PRICE_RANGES = [
  { id: 'all', label: 'Any Price' },
  { id: 'under-150', label: 'Under ₹150' },
  { id: '150-300', label: '₹150 - ₹300' },
  { id: '300-600', label: '₹300 - ₹600' },
  { id: 'above-600', label: 'Above ₹600' },
];

export function PosSidebar({
  selectedCategory,
  onSelectCategory,
  selectedStoreId,
  onSelectStore,
  selectedPriceRange = 'all',
  onSelectPriceRange,
  inStockOnly = false,
  onToggleInStockOnly,
  onResetFilters,
  onOpenDeals,
}: PosSidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const { stores } = useStores();
  const [profileOpen, setProfileOpen] = useState(false);

  // Section collapse states (Amazon/Flipkart accordion style)
  const [storesExpanded, setStoresExpanded] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [priceExpanded, setPriceExpanded] = useState(true);

  // Display name requirement: Only show the user when the name is not available
  const displayName = user?.name && user.name.trim().length > 0 ? user.name : (user?.role || 'User');
  const userInitial = displayName.charAt(0).toUpperCase() || 'U';

  const hasActiveFilters =
    (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'All Categories') ||
    (selectedPriceRange && selectedPriceRange !== 'all') ||
    inStockOnly;

  return (
    <>
      <Box
        sx={{
          width: { xs: 260, xl: 280 },
          flexShrink: 0,
          display: { xs: 'none', lg: 'flex' },
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          borderRight: '1px solid #E2E8F0',
          height: 'calc(100vh - 70px)',
          flexDirection: 'column',
          position: 'sticky',
          top: 70,
          overflow: 'hidden',
        }}
      >
        {/* Scrollable Middle Container */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2.2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#E2E8F0', borderRadius: '4px' },
          }}
        >
          {/* ==================================================== */}
          {/* 1. REQUIRED NAVIGATION LINKS                         */}
          {/* ==================================================== */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: '#94A3B8',
                letterSpacing: '0.08em',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                px: 1,
                mb: 1,
                display: 'block',
              }}
            >
              NAVIGATION
            </Typography>

            <Stack spacing={0.6}>
              {/* Order Menu */}
              <Button
                component={Link}
                href="/pos"
                startIcon={
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      backgroundColor: pathname === '/pos' || pathname === '/' ? '#FF7A00' : '#F1F5F9',
                      color: pathname === '/pos' || pathname === '/' ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RestaurantIcon sx={{ fontSize: 16 }} />
                  </Box>
                }
                sx={{
                  justifyContent: 'flex-start',
                  px: 1.2,
                  py: 0.8,
                  borderRadius: '10px',
                  backgroundColor: pathname === '/pos' || pathname === '/' ? 'rgba(255, 122, 0, 0.08)' : 'transparent',
                  color: pathname === '/pos' || pathname === '/' ? '#FF7A00' : '#334155',
                  fontWeight: pathname === '/pos' || pathname === '/' ? 700 : 600,
                  fontSize: '0.825rem',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: 'rgba(255, 122, 0, 0.12)' },
                }}
              >
                Order Menu
              </Button>

              {/* My Orders (Customer section) */}
              <Button
                component={Link}
                href={user ? '/my-orders' : '/login'}
                startIcon={
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      backgroundColor: pathname === '/my-orders' ? '#FF7A00' : '#F1F5F9',
                      color: pathname === '/my-orders' ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingBagIcon sx={{ fontSize: 16 }} />
                  </Box>
                }
                sx={{
                  justifyContent: 'flex-start',
                  px: 1.2,
                  py: 0.8,
                  borderRadius: '10px',
                  backgroundColor: pathname === '/my-orders' ? 'rgba(255, 122, 0, 0.08)' : 'transparent',
                  color: pathname === '/my-orders' ? '#FF7A00' : '#334155',
                  fontWeight: pathname === '/my-orders' ? 700 : 600,
                  fontSize: '0.825rem',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: 'rgba(255, 122, 0, 0.12)' },
                }}
              >
                My Orders
              </Button>

              {/* Deals & Combos */}
              {onOpenDeals && (
                <Button
                  onClick={onOpenDeals}
                  startIcon={
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        backgroundColor: '#FEF3C7',
                        color: '#D97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LocalOfferIcon sx={{ fontSize: 16 }} />
                    </Box>
                  }
                  sx={{
                    justifyContent: 'flex-start',
                    px: 1.2,
                    py: 0.8,
                    borderRadius: '10px',
                    color: '#D97706',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#FFFBEB' },
                  }}
                >
                  Special Deals
                </Button>
              )}

              {/* Admin Shortcuts */}
              {isAdmin && (
                <Button
                  component={Link}
                  href="/analytics"
                  startIcon={
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BarChartIcon sx={{ fontSize: 16 }} />
                    </Box>
                  }
                  sx={{
                    justifyContent: 'flex-start',
                    px: 1.2,
                    py: 0.8,
                    borderRadius: '10px',
                    color: '#2563EB',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#EFF6FF' },
                  }}
                >
                  Analytics Dashboard
                </Button>
              )}
            </Stack>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* ==================================================== */}
          {/* 2. UNIFIED AMAZON / FLIPKART STYLE FILTERS PANEL     */}
          {/* ==================================================== */}
          <Box>
            {/* Filter Header with Clear All */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <FilterAltIcon sx={{ fontSize: 18, color: '#FF7A00' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                  Filters
                </Typography>
              </Box>
              {hasActiveFilters && onResetFilters && (
                <Button
                  size="small"
                  onClick={onResetFilters}
                  startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    p: 0,
                    minWidth: 0,
                    textTransform: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#EA580C',
                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  Clear All
                </Button>
              )}
            </Box>

            <Stack spacing={2}>
              {/* FILTER A: RESTAURANTS / OUTLETS (eCommerce Brand Filter Style) */}
              <Box
                sx={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  overflow: 'hidden',
                }}
              >
                <Box
                  onClick={() => setStoresExpanded(!storesExpanded)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.2,
                    px: 1.5,
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: '#FFFFFF',
                    borderBottom: storesExpanded ? '1px solid #E2E8F0' : 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <StorefrontIcon sx={{ fontSize: 16, color: '#FF7A00' }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '0.78rem' }}>
                      Restaurant Branch ({stores.length})
                    </Typography>
                  </Box>
                  {storesExpanded ? <ExpandLessIcon sx={{ fontSize: 18, color: '#94A3B8' }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: '#94A3B8' }} />}
                </Box>

                <Collapse in={storesExpanded}>
                  <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.8, maxHeight: 180, overflowY: 'auto' }}>
                    {stores.map((st) => {
                      const isSelected = selectedStoreId === st.id;
                      return (
                        <Box
                          key={st.id}
                          onClick={() => onSelectStore && onSelectStore(st.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#FFEDD5' : '#FFFFFF',
                            border: isSelected ? '1.5px solid #FB923C' : '1px solid #E2E8F0',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              borderColor: '#FB923C',
                              backgroundColor: isSelected ? '#FFEDD5' : '#FFF7ED',
                            },
                          }}
                        >
                          <Box sx={{ minWidth: 0, pr: 1 }}>
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                fontWeight: isSelected ? 800 : 600,
                                color: isSelected ? '#9A3412' : '#1E293B',
                                fontSize: '0.78rem',
                              }}
                            >
                              {st.name}
                            </Typography>
                            <Typography variant="caption" noWrap sx={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>
                              📍 {st.location}
                            </Typography>
                          </Box>
                          {isSelected && <CheckCircleIcon sx={{ fontSize: 16, color: '#EA580C', flexShrink: 0 }} />}
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>

              {/* FILTER B: MENU CATEGORIES (eCommerce Departments / Category Style) */}
              <Box
                sx={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  overflow: 'hidden',
                }}
              >
                <Box
                  onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.2,
                    px: 1.5,
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: '#FFFFFF',
                    borderBottom: categoriesExpanded ? '1px solid #E2E8F0' : 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <RestaurantIcon sx={{ fontSize: 16, color: '#FF7A00' }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '0.78rem' }}>
                      Categories
                    </Typography>
                  </Box>
                  {categoriesExpanded ? <ExpandLessIcon sx={{ fontSize: 18, color: '#94A3B8' }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: '#94A3B8' }} />}
                </Box>

                <Collapse in={categoriesExpanded}>
                  <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 220, overflowY: 'auto' }}>
                    {CATEGORY_ITEMS.map((cat) => {
                      const isSelected =
                        selectedCategory === cat.label ||
                        (selectedCategory === 'All' && cat.id === 'all') ||
                        (selectedCategory === 'Veg. Mania' && cat.id === 'veg-mania');

                      return (
                        <Box
                          key={cat.id}
                          onClick={() => onSelectCategory(cat.id === 'all' ? 'All' : cat.label)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.2,
                            py: 0.7,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#FF7A00' : 'transparent',
                            color: isSelected ? '#FFFFFF' : '#475569',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.8rem',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              backgroundColor: isSelected ? '#E06500' : '#F1F5F9',
                              color: isSelected ? '#FFFFFF' : '#0F172A',
                            },
                          }}
                        >
                          <Box sx={{ color: isSelected ? '#FFFFFF' : '#64748B', display: 'flex', alignItems: 'center' }}>
                            {cat.icon}
                          </Box>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'inherit', flex: 1 }}>
                            {cat.label}
                          </Typography>
                          {isSelected && <CheckCircleIcon sx={{ fontSize: 14, color: '#FFFFFF' }} />}
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>

              {/* FILTER C: PRICE RANGE (eCommerce Price Filter Style) */}
              {onSelectPriceRange && (
                <Box
                  sx={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    onClick={() => setPriceExpanded(!priceExpanded)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.2,
                      px: 1.5,
                      cursor: 'pointer',
                      userSelect: 'none',
                      backgroundColor: '#FFFFFF',
                      borderBottom: priceExpanded ? '1px solid #E2E8F0' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <CurrencyRupeeIcon sx={{ fontSize: 16, color: '#FF7A00' }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '0.78rem' }}>
                        Price Range
                      </Typography>
                    </Box>
                    {priceExpanded ? <ExpandLessIcon sx={{ fontSize: 18, color: '#94A3B8' }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: '#94A3B8' }} />}
                  </Box>

                  <Collapse in={priceExpanded}>
                    <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                      {PRICE_RANGES.map((pr) => {
                        const isSelected = selectedPriceRange === pr.id;
                        return (
                          <Box
                            key={pr.id}
                            onClick={() => onSelectPriceRange(pr.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              px: 1.2,
                              py: 0.6,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'rgba(255, 122, 0, 0.1)' : 'transparent',
                              color: isSelected ? '#EA580C' : '#475569',
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: '0.78rem',
                              '&:hover': {
                                backgroundColor: isSelected ? 'rgba(255, 122, 0, 0.15)' : '#F1F5F9',
                              },
                            }}
                          >
                            <span>{pr.label}</span>
                            {isSelected && <CheckCircleIcon sx={{ fontSize: 14, color: '#EA580C' }} />}
                          </Box>
                        );
                      })}
                    </Box>
                  </Collapse>
                </Box>
              )}

              {/* FILTER D: AVAILABILITY / IN STOCK */}
              {onToggleInStockOnly && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.2,
                    px: 1.5,
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.78rem' }}>
                    In Stock Only
                  </Typography>
                  <Switch
                    size="small"
                    checked={inStockOnly}
                    onChange={(e) => onToggleInStockOnly(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#FF7A00',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#FF7A00',
                      },
                    }}
                  />
                </Box>
              )}
            </Stack>
          </Box>
        </Box>

        {/* ==================================================== */}
        {/* 3. USER PROFILE AT BOTTOM OF SIDEBAR WITH LOGOUT      */}
        {/* ==================================================== */}
        <Box
          sx={{
            p: 1.8,
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
          }}
        >
          {user ? (
            <Box>
              {/* Clickable Profile Card */}
              <Box
                onClick={() => setProfileOpen(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  p: 1,
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#FF7A00',
                    boxShadow: '0 4px 12px rgba(255, 122, 0, 0.12)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    backgroundColor: '#FF7A00',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                  }}
                >
                  {userInitial}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {/* Clean User Name Requirement: Only show name; show user when name is not available */}
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.825rem', lineHeight: 1.2 }}
                  >
                    {displayName}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ color: '#64748B', fontSize: '0.7rem', display: 'block' }}
                  >
                    {user.email}
                  </Typography>
                </Box>
                <Chip
                  label={user.role}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    backgroundColor: user.role === 'SUPERADMIN' ? '#EFF6FF' : user.role === 'ADMIN' ? '#EFF6FF' : '#DCFCE7',
                    color: user.role === 'SUPERADMIN' ? '#1D4ED8' : user.role === 'ADMIN' ? '#2563EB' : '#15803D',
                    borderRadius: '4px',
                    '& .MuiChip-label': { px: 0.6 },
                  }}
                />
              </Box>

              {/* Action Buttons: View Profile & Logout */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Button
                  onClick={() => setProfileOpen(true)}
                  size="small"
                  fullWidth
                  variant="outlined"
                  sx={{
                    borderRadius: '8px',
                    borderColor: '#CBD5E1',
                    color: '#475569',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.5,
                    '&:hover': { borderColor: '#94A3B8', backgroundColor: '#FFFFFF' },
                  }}
                >
                  My Profile
                </Button>
                <Tooltip title="Log Out">
                  <Button
                    onClick={logout}
                    size="small"
                    variant="outlined"
                    color="error"
                    sx={{
                      minWidth: 36,
                      p: 0.5,
                      borderRadius: '8px',
                      borderColor: '#FCA5A5',
                      color: '#EF4444',
                      '&:hover': { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: 16 }} />
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            /* Guest Customer state */
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem', mb: 0.5 }}>
                Guest Customer
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem', display: 'block', mb: 1 }}>
                Sign in to place orders and view order history
              </Typography>
              <Button
                component={Link}
                href="/login"
                variant="contained"
                fullWidth
                size="small"
                sx={{
                  backgroundColor: '#FF7A00',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  borderRadius: '8px',
                  textTransform: 'none',
                  py: 0.6,
                  '&:hover': { backgroundColor: '#E06500' },
                }}
              >
                Sign In / Register
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* User Profile Dialog */}
      <UserProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
