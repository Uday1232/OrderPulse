'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Select,
  MenuItem,
  FormControl,
  Alert,
  Stack,
  LinearProgress,
  Chip,
  Pagination,
  Divider,
  Button,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useQuery } from '@tanstack/react-query';

import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminGuard } from '../../components/auth/AdminGuard';
import { ApiService } from '../../services/api';
import { useStores } from '../../hooks/useStores';

export default function AnalyticsDashboardPage() {
  const { stores } = useStores();
  const [selectedStore, setSelectedStore] = useState<string>('all');

  // Unified Analytics Query with instant placeholder data (zero-delay switching)
  const isAllStores = selectedStore === 'all';
  const targetStoreId = !isAllStores ? selectedStore : undefined;

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['analytics', selectedStore],
    queryFn: () => ApiService.getAnalytics({ store_id: targetStoreId }),
    placeholderData: (previousData) => previousData,
    refetchInterval: 15000,
  });

  const analytics = data?.data;
  const summary = analytics?.summary || { totalOrders: 0, totalRevenue: 0, totalStores: stores.length };
  const rawOrdersPerDay = analytics?.ordersPerDay || [];
  const rawRevenuePerStore = analytics?.revenuePerStore || [];
  const rawTopItems = analytics?.topSellingItems || [];

  // Selected Store Object
  const selectedStoreObj = useMemo(() => {
    return stores.find((s) => s.id === selectedStore);
  }, [stores, selectedStore]);

  // Selected Store Stat (when filtered)
  const singleStoreStat = useMemo(() => {
    if (isAllStores) return null;
    return (
      rawRevenuePerStore.find((s) => s.store_id === selectedStore) || {
        store_id: selectedStore,
        store_name: selectedStoreObj?.name || 'Selected Branch',
        total_orders: summary.totalOrders,
        total_revenue: summary.totalRevenue,
        avg_order_value: summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0,
      }
    );
  }, [isAllStores, rawRevenuePerStore, selectedStore, selectedStoreObj, summary]);

  // Pagination for Stores Breakdown (Assessment Task 3)
  const [storePage, setStorePage] = useState(1);
  const storesPerPage = 4;
  const totalStorePages = Math.max(Math.ceil(rawRevenuePerStore.length / storesPerPage), 1);
  const paginatedRevenuePerStore = useMemo(() => {
    const start = (storePage - 1) * storesPerPage;
    return rawRevenuePerStore.slice(start, start + storesPerPage);
  }, [rawRevenuePerStore, storePage]);

  // Max calculations for bar rendering
  const maxDailyCount = Math.max(...rawOrdersPerDay.map((d) => d.order_count), 1);
  const maxStoreRevenue = Math.max(...rawRevenuePerStore.map((s) => s.total_revenue), 1);
  const maxTopItemCount = Math.max(...rawTopItems.map((i) => i.total_quantity_sold), 1);

  // Store ranking palette
  const storeColors = ['#3B82F6', '#FF7A00', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <AdminGuard>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 4 }, overflowY: 'auto' }}>
          {/* Top Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' } }}>
                  Analytics Dashboard
                </Typography>
                <Chip
                  label={isAllStores ? 'All Stores Overview' : (selectedStoreObj?.name || 'Store Filtered')}
                  size="small"
                  sx={{
                    backgroundColor: isAllStores ? '#EFF6FF' : '#FFF7ED',
                    color: isAllStores ? '#1D4ED8' : '#EA580C',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                {isAllStores
                  ? 'Real-time aggregated multi-store sales, volume trends, and best-selling dishes'
                  : `Real-time analytics, revenue performance, and daily trends for ${selectedStoreObj?.name || 'selected branch'}`}
              </Typography>
            </Box>
          </Box>

          {/* Non-blocking background fetch indicator */}
          {isFetching && (
            <LinearProgress
              sx={{
                height: 3,
                borderRadius: 1.5,
                mb: 2,
                backgroundColor: '#EFF6FF',
                '& .MuiLinearProgress-bar': { backgroundColor: '#3B82F6' },
              }}
            />
          )}

          {isError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              {(error as Error)?.message || 'Failed to fetch analytics'}
            </Alert>
          )}

          {/* Section 1: Executive KPI Cards (Row 1 - 3 Primary Metrics) */}
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            {/* Total Orders */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2.8, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Orders
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 1 }}>
                  {summary.totalOrders}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {isAllStores ? 'All branches combined' : 'Selected branch'}
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Total Revenue */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2.8, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Revenue
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 1 }}>
                  ₹{Number(summary.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Real-time sales
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Operating Stores / Scope */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2.8, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isAllStores ? 'Operating Stores' : 'Branch Scope'}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 1 }}>
                  {isAllStores ? (summary.totalStores || stores.length) : 1}
                </Typography>
                <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 700 }}>
                  {isAllStores ? 'All operational' : (selectedStoreObj?.name || 'Selected branch')}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Section 2: Orders Per Day (Full Width Chart - Assessment Task 3) */}
          <Card sx={{ p: 3, mb: 3.5, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
                  Orders Per Day
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  {isAllStores ? 'Daily orders and revenue trend across all stores' : `Daily performance for ${selectedStoreObj?.name}`}
                </Typography>
              </Box>
              <Chip
                label="Chronological (Past 7-14 Days)"
                size="small"
                sx={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}
              />
            </Box>

            {rawOrdersPerDay.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8' }}>
                <ReceiptLongIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                  No daily orders found for this selection
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Orders placed in POS will dynamically appear here in real-time.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 210, pt: 2, px: 2, overflowX: 'auto', gap: 2 }}>
                {rawOrdersPerDay.slice(-14).map((item) => {
                  const barHeight = Math.max((item.order_count / maxDailyCount) * 130, 16);
                  const dateParts = item.date.split('-');
                  const formattedDay = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : item.date;

                  return (
                    <Box key={item.date} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8, minWidth: 42, flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.75rem' }}>
                        {item.order_count}
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: 38,
                          height: barHeight,
                          background: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.3s ease',
                          '&:hover': {
                            background: 'linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)',
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>
                        {formattedDay}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, fontSize: '0.68rem', mt: -0.3 }}>
                        ₹{Math.round(item.daily_revenue)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Card>

          {/* Section 3 & 4: Total Revenue Per Store & Top 5 Selling Items (50/50 Grid - Assessment Task 3) */}
          <Grid container spacing={3}>
            {/* 1. Total Revenue Per Store (With Store Dropdown Filter & Pagination) */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>
                      Total Revenue Per Store
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      {isAllStores ? 'Comparative revenue & order contribution' : `Financial performance for ${selectedStoreObj?.name || 'Selected Branch'}`}
                    </Typography>
                  </Box>

                  {/* Store Dropdown Selector Directly in Revenue Per Store Header */}
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      value={selectedStore}
                      onChange={(e) => {
                        setSelectedStore(e.target.value);
                        setStorePage(1);
                      }}
                      sx={{
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: '#0F172A',
                        '& .MuiSelect-select': { color: '#0F172A !important', py: 0.9, px: 1.5 },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1 !important' },
                        '& .MuiSvgIcon-root': { color: '#64748B' },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            '& .MuiMenuItem-root': {
                              color: '#0F172A',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              py: 1,
                              '&:hover': { backgroundColor: '#F1F5F9' },
                              '&.Mui-selected': { backgroundColor: '#EFF6FF', color: '#1D4ED8' },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="all">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EqualizerIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            All Stores (Combined)
                          </Typography>
                        </Box>
                      </MenuItem>
                      <Divider sx={{ my: 0.5 }} />
                      {stores.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StorefrontIcon sx={{ fontSize: 16, color: '#FF7A00' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                              {s.name}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Body: All Stores (Paginated) vs Single Store View */}
                {isAllStores ? (
                  rawRevenuePerStore.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8', my: 'auto' }}>
                      <StorefrontIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                        No store revenue recorded yet
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Stack spacing={2} sx={{ my: 1.5 }}>
                        {paginatedRevenuePerStore.map((st, idx) => {
                          const pct = Math.round((st.total_revenue / maxStoreRevenue) * 100);
                          const storeIndex = (storePage - 1) * storesPerPage + idx;
                          const color = storeColors[storeIndex % storeColors.length]!;

                          return (
                            <Box
                              key={st.store_id}
                              onClick={() => {
                                setSelectedStore(st.store_id);
                                setStorePage(1);
                              }}
                              sx={{
                                p: 1.8,
                                borderRadius: '12px',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: '#F1F5F9',
                                  borderColor: '#CBD5E1',
                                  transform: 'translateY(-1px)',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                    {st.store_name}
                                  </Typography>
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                  ₹{Number(st.total_revenue).toFixed(2)}
                                </Typography>
                              </Box>

                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: '#E2E8F0',
                                  mb: 1,
                                  '& .MuiLinearProgress-bar': { backgroundColor: color },
                                }}
                              />

                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                  {st.total_orders} total {st.total_orders === 1 ? 'order' : 'orders'} placed
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#1E293B', fontWeight: 700 }}>
                                  Avg: ₹{Number(st.avg_order_value || 0).toFixed(2)} / order
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>

                      {/* Pagination Controls for Stores (Assessment Requirement) */}
                      {totalStorePages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #F1F5F9' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                            Page {storePage} of {totalStorePages} ({rawRevenuePerStore.length} stores)
                          </Typography>
                          <Pagination
                            count={totalStorePages}
                            page={storePage}
                            onChange={(_, p) => setStorePage(p)}
                            size="small"
                            shape="rounded"
                            sx={{
                              '& .MuiPaginationItem-root': { fontWeight: 700, fontSize: '0.75rem', minWidth: 28, height: 28 },
                              '& .Mui-selected': { backgroundColor: '#0F172A !important', color: '#FFFFFF !important' },
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  )
                ) : (
                  /* Single Store Focus View */
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', my: 2 }}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: '16px',
                        backgroundColor: '#F8FAFC',
                        border: '1.5px solid #E2E8F0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <StorefrontIcon sx={{ color: '#3B82F6', fontSize: 24 }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
                              {singleStoreStat?.store_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                              {selectedStoreObj?.location || 'Operational Branch'}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label="Branch View"
                          size="small"
                          sx={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            Branch Revenue
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                            ₹{Number(singleStoreStat?.total_revenue || 0).toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            Orders Placed
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                            {singleStoreStat?.total_orders || 0}
                          </Typography>
                        </Grid>
                      </Grid>

                      <LinearProgress
                        variant="determinate"
                        value={100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#E2E8F0',
                          mb: 1.5,
                          '& .MuiLinearProgress-bar': { backgroundColor: '#3B82F6' },
                        }}
                      />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                          Average Order Value (AOV):
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 800 }}>
                          ₹{Number(singleStoreStat?.avg_order_value || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RestartAltIcon />}
                        onClick={() => {
                          setSelectedStore('all');
                          setStorePage(1);
                        }}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          borderColor: '#CBD5E1',
                          color: '#475569',
                          '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F1F5F9' },
                        }}
                      >
                        Reset to All Stores
                      </Button>
                    </Box>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* 2. Top 5 Selling Items (JSONB Aggregation - Assessment Task 3) */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>
                      Top 5 Selling Items
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      {isAllStores ? 'PostgreSQL JSONB dish ranking across all stores' : `Top selling dishes for ${selectedStoreObj?.name}`}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<EmojiEventsIcon sx={{ fontSize: '14px !important', color: '#D97706 !important' }} />}
                    label="Leaderboard"
                    size="small"
                    sx={{ backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.72rem' }}
                  />
                </Box>

                {rawTopItems.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8', my: 'auto' }}>
                    <RestaurantMenuIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                      No item sales recorded yet
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Completed customer purchases will rank dishes here dynamically.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5} sx={{ my: 'auto' }}>
                    {rawTopItems.map((item, idx) => {
                      const pct = Math.round((item.total_quantity_sold / maxTopItemCount) * 100);
                      const rankColors = ['#D97706', '#64748B', '#B45309', '#3B82F6', '#10B981'];
                      const rankColor = rankColors[idx] || '#64748B';

                      return (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                backgroundColor: idx === 0 ? '#FEF3C7' : '#F1F5F9',
                                color: rankColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                flexShrink: 0,
                              }}
                            >
                              #{idx + 1}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: '#1E293B' }}>
                                {item.item_name}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: '#E2E8F0',
                                  mt: 0.5,
                                  '& .MuiLinearProgress-bar': { backgroundColor: rankColor },
                                }}
                              />
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              ₹{Number(item.total_revenue).toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                              {item.total_quantity_sold} sold
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </AdminGuard>
  );
}
