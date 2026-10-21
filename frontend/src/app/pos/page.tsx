'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Drawer,
  IconButton,
  Pagination,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import CoffeeIcon from '@mui/icons-material/Coffee';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';

import { PosSidebar } from '../../components/pos/PosSidebar';
import { PosHeader } from '../../components/pos/PosHeader';
import { PosItemCard } from '../../components/pos/PosItemCard';
import { PosDetailPanel } from '../../components/pos/PosDetailPanel';
import { PosCheckoutModal } from '../../components/pos/PosCheckoutModal';
import { PosDealsModal } from '../../components/pos/PosDealsModal';

import { useOrderSocket } from '../../context/SocketContext';
import { useMenu } from '../../hooks/useMenu';
import { useDebounce } from '../../hooks/useDebounce';
import { useCartStore } from '../../store/useCartStore';

const MOBILE_CATEGORIES = [
  { label: 'All', icon: <RestaurantIcon sx={{ fontSize: 16 }} /> },
  { label: 'Veg. Mania', icon: <LunchDiningIcon sx={{ fontSize: 16 }} /> },
  { label: 'Sandwich', icon: <FastfoodIcon sx={{ fontSize: 16 }} /> },
  { label: 'Veg. Pizza', icon: <LocalPizzaIcon sx={{ fontSize: 16 }} /> },
  { label: 'Burger', icon: <LunchDiningIcon sx={{ fontSize: 16 }} /> },
  { label: 'French Fries', icon: <FastfoodIcon sx={{ fontSize: 16 }} /> },
  { label: 'Hot-Coffee', icon: <CoffeeIcon sx={{ fontSize: 16 }} /> },
  { label: 'Ice-Tea', icon: <LocalCafeIcon sx={{ fontSize: 16 }} /> },
];

export default function PosPage() {
  const { currentStoreId, setCurrentStoreId, activePreparedOrder, dismissPreparedOrder } = useOrderSocket();
  const { allItems, isLoading, isError, error } = useMenu(currentStoreId);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchInput, setSearchInput] = useState<string>('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const {
    inspectedItem,
    setInspectedItem,
    isCheckoutOpen,
    setIsCheckoutOpen,
    getTotalCount,
    getTotalAmount,
  } = useCartStore();

  const totalCartCount = getTotalCount();
  const totalCartAmount = getTotalAmount();

  const [dealAlertOpen, setDealAlertOpen] = useState(false);

  // Set initial inspected item once items load
  React.useEffect(() => {
    if (allItems.length > 0 && !inspectedItem) {
      setInspectedItem(allItems[0] || null);
    }
  }, [allItems, inspectedItem, setInspectedItem]);

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Search filter
      const matchesSearch =
        !debouncedSearch ||
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(debouncedSearch.toLowerCase()));

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory === 'All' || selectedCategory === 'Veg. Mania') {
        return true;
      }

      if (selectedCategory === 'Main Menu' || selectedCategory === 'Appetizer' || selectedCategory === 'Beverages') {
        return item.category?.name.toLowerCase() === selectedCategory.toLowerCase();
      }

      // Keyword match for subcategories (e.g. Sandwich, Pizza, Burger, Fries, Coffee, etc.)
      const catLower = selectedCategory.toLowerCase();
      const itemCatLower = (item.category?.name || '').toLowerCase();
      const itemNameLower = item.name.toLowerCase();

      return itemNameLower.includes(catLower) || itemCatLower.includes(catLower);
    });
  }, [allItems, debouncedSearch, selectedCategory]);

  // Pagination for POS Dishes
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Reset page when category or search changes
  React.useEffect(() => {
    setPage(1);
  }, [selectedCategory, debouncedSearch]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: 'calc(100vh - 70px)',
        backgroundColor: '#F8FAFC',
        color: '#1E293B',
        position: 'relative',
      }}
    >
      {/* 1. Left Category Sidebar (Desktop only) */}
      <PosSidebar
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* 2. Center Menu Feed + Header */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          borderRight: { xs: 'none', lg: '1px solid #E2E8F0' },
        }}
      >
        {/* Top Header */}
        <PosHeader
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          selectedStoreId={currentStoreId}
          onStoreChange={(id) => setCurrentStoreId(id)}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onShowDeals={() => setDealAlertOpen(true)}
        />

        {/* Content Body */}
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, flex: 1, overflowY: 'auto', pb: { xs: 10, md: 3 } }}>
          {/* Order Prepared Alert Banner for Customer */}
          {activePreparedOrder && (
            <Box
              sx={{
                mb: 2.5,
                p: { xs: 2, sm: 2.5 },
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                animation: 'pulse 2s infinite ease-in-out',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.006)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: { xs: '1.2rem', sm: '1.5rem' },
                    flexShrink: 0,
                  }}
                >
                  🍽️
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                    Order #{activePreparedOrder.id.slice(0, 8)} is PREPARED!
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.95, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                    Please head to the pickup counter to collect your meal (${Number(activePreparedOrder.total_amount || 0).toFixed(2)}).
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={dismissPreparedOrder}
                sx={{
                  backgroundColor: '#FFFFFF',
                  color: '#065F46',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  borderRadius: '10px',
                  textTransform: 'none',
                  px: 2,
                  '&:hover': { backgroundColor: '#F0FDF4' },
                }}
              >
                Got It!
              </Button>
            </Box>
          )}

          {/* Mobile Horizontal Category Chips (Visible on mobile/tablet) */}
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              overflowX: 'auto',
              py: 1,
              gap: 1,
              mb: 2,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            {MOBILE_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.label || (selectedCategory === 'All' && cat.label === 'All');
              return (
                <Chip
                  key={cat.label}
                  icon={cat.icon}
                  label={cat.label}
                  onClick={() => setSelectedCategory(cat.label)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    borderRadius: '10px',
                    px: 0.8,
                    py: 1.8,
                    backgroundColor: isActive ? '#FF7A00' : '#FFFFFF',
                    color: isActive ? '#FFFFFF !important' : '#475569',
                    border: isActive ? '1px solid #FF7A00' : '1px solid #E2E8F0',
                    boxShadow: isActive ? '0 3px 10px rgba(255, 122, 0, 0.3)' : 'none',
                    '& .MuiChip-icon': {
                      color: isActive ? '#FFFFFF !important' : '#64748B !important',
                    },
                    '&:hover': {
                      backgroundColor: isActive ? '#E06500' : '#F1F5F9',
                    },
                  }}
                />
              );
            })}
          </Box>

          {/* Menu Count Banner */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#FF7A00',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                letterSpacing: '-0.01em',
              }}
            >
              {filteredItems.length}+ Delicious Dishes
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {filteredItems.length} handcrafted items
            </Typography>
          </Box>

          {/* Loading / Error States */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#FF7A00' }} />
            </Box>
          )}

          {isError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }}>
              {(error as Error)?.message || 'Failed to load store menu'}
            </Alert>
          )}

          {/* Food Cards Grid */}
          {!isLoading && filteredItems.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: '#94A3B8' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                No food items found matching your filter
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Try searching for "Burger", "Sandwich", "Pizza", or clear search.
              </Typography>
            </Box>
          )}

          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {paginatedItems.map((item) => (
              <Grid item xs={12} sm={6} md={6} lg={4} key={item.id}>
                <PosItemCard
                  item={item}
                  isSelected={inspectedItem?.id === item.id}
                  onInspect={(it) => {
                    setInspectedItem(it);
                    setMobileDetailOpen(true);
                  }}
                />
              </Grid>
            ))}
          </Grid>

          {/* Menu Pagination Controls */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 1 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => {
                  setPage(val);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontWeight: 700,
                    borderRadius: '10px',
                    color: '#334155',
                  },
                  '& .Mui-selected': {
                    backgroundColor: '#FF7A00 !important',
                    color: '#FFFFFF !important',
                    boxShadow: '0 3px 10px rgba(255, 122, 0, 0.35)',
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* 3. Right Inspection Detail Panel (Desktop only) */}
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <PosDetailPanel item={inspectedItem} />
      </Box>

      {/* Mobile Bottom Sheet Drawer for Item Inspection */}
      <Drawer
        anchor="bottom"
        open={mobileDetailOpen}
        onClose={() => setMobileDetailOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            maxHeight: '85vh',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <Box sx={{ width: 44, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, mx: 'auto', mt: 1.5, mb: 0.5 }} />
        <PosDetailPanel item={inspectedItem} onClose={() => setMobileDetailOpen(false)} />
      </Drawer>

      {/* Sticky Bottom Floating Cart Bar for Mobile (when items added) */}
      {totalCartCount > 0 && (
        <Box
          onClick={() => setIsCheckoutOpen(true)}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 999,
            backgroundColor: '#0F172A',
            border: '1px solid #FF7A00',
            color: '#FFFFFF',
            borderRadius: '16px',
            p: 1.5,
            px: 2,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'transform 0.15s ease-in-out',
            '&:active': { transform: 'scale(0.98)' },
          }}
        >
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
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 20, color: '#FFFFFF' }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                {totalCartCount} {totalCartCount === 1 ? 'Item' : 'Items'} in Cart
              </Typography>
              <Typography variant="caption" sx={{ color: '#FF7A00', fontWeight: 700, fontSize: '0.8rem' }}>
                Total: ₹{totalCartAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            sx={{
              backgroundColor: '#FF7A00',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8rem',
              borderRadius: '10px',
              px: 2,
              py: 0.8,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#E06500' },
            }}
          >
            Checkout
          </Button>
        </Box>
      )}

      {/* 4. Checkout Modal */}
      <PosCheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        storeId={currentStoreId}
      />

      {/* 5. Best Offer Deals Modal (Managed by Admin) */}
      <PosDealsModal
        open={dealAlertOpen}
        onClose={() => setDealAlertOpen(false)}
      />
    </Box>
  );
}
