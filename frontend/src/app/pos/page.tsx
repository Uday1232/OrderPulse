'use client';

import React, { useState, useMemo } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert, Snackbar } from '@mui/material';

import { PosSidebar } from '../../components/pos/PosSidebar';
import { PosHeader } from '../../components/pos/PosHeader';
import { PosItemCard } from '../../components/pos/PosItemCard';
import { PosDetailPanel } from '../../components/pos/PosDetailPanel';
import { PosCheckoutModal } from '../../components/pos/PosCheckoutModal';

import { useOrderSocket } from '../../context/SocketContext';
import { useMenu } from '../../hooks/useMenu';
import { useDebounce } from '../../hooks/useDebounce';
import { useCartStore } from '../../store/useCartStore';
import { Item } from '../../types/order';

export default function PosPage() {
  const { currentStoreId, setCurrentStoreId } = useOrderSocket();
  const { allItems, isLoading, isError, error } = useMenu(currentStoreId);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchInput, setSearchInput] = useState<string>('');
  const debouncedSearch = useDebounce(searchInput, 500);

  const {
    inspectedItem,
    setInspectedItem,
    isCheckoutOpen,
    setIsCheckoutOpen,
  } = useCartStore();

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

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: 'calc(100vh - 70px)',
        backgroundColor: '#F8FAFC',
        color: '#1E293B',
      }}
    >
      {/* 1. Left Category Sidebar */}
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
          borderRight: '1px solid #E2E8F0',
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
        <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
          {/* Menu Count Banner */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#FF7A00',
                fontSize: '1.25rem',
                letterSpacing: '-0.01em',
              }}
            >
              {filteredItems.length}+ Delicious Food Menu
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              Showing {filteredItems.length} handcrafted items
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

          <Grid container spacing={2.5}>
            {filteredItems.map((item) => (
              <Grid item xs={12} sm={6} md={6} lg={4} key={item.id}>
                <PosItemCard
                  item={item}
                  isSelected={inspectedItem?.id === item.id}
                  onInspect={(it) => setInspectedItem(it)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* 3. Right Inspection Detail Panel */}
      <PosDetailPanel item={inspectedItem} />

      {/* 4. Checkout Modal */}
      <PosCheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        storeId={currentStoreId}
      />

      {/* Best Offer Deals Notification */}
      <Snackbar
        open={dealAlertOpen}
        autoHideDuration={4000}
        onClose={() => setDealAlertOpen(false)}
        message="🔥 Special Deal Activated: Get 20% off all artisanal sandwiches and combo pizzas today!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
