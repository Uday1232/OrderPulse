'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorageIcon from '@mui/icons-material/Storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminGuard } from '../../components/auth/AdminGuard';
import { ApiService } from '../../services/api';

export default function AnalyticsPage() {
  const queryClient = useQueryClient();

  // Fetch Analytics with React Query (real-time, refetched on socket events or refresh button)
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => ApiService.getAnalytics(true),
    refetchInterval: 15000, // Background poll every 15s in addition to WebSocket cache-bust
  });

  const analytics = data?.data;
  const summary = analytics?.summary || { totalOrders: 0, totalRevenue: 0, totalStores: 0 };
  const avgOrderValue = summary.totalOrders > 0 ? (summary.totalRevenue / summary.totalOrders).toFixed(2) : '0.00';

  // Real-time daily orders (last 7 days from DB)
  const rawOrdersPerDay = analytics?.ordersPerDay || [];
  const displayOrdersPerDay = rawOrdersPerDay.length > 0
    ? rawOrdersPerDay.slice(-7).map((d) => {
        const parts = d.date.split('-');
        const formattedDate = parts.length === 3 ? `${new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : d.date;
        return {
          day: formattedDate,
          count: d.order_count,
          revenue: d.daily_revenue,
        };
      })
    : [];

  const maxDailyCount = Math.max(...displayOrdersPerDay.map((d) => d.count), 1);

  // Real-time revenue per store
  const storeColors = ['#3B82F6', '#FF7A00', '#10B981', '#8B5CF6', '#EC4899'];
  const rawRevenuePerStore = analytics?.revenuePerStore || [];
  const displayRevenuePerStore = rawRevenuePerStore.map((s, idx) => ({
    store: s.store_name || `Store #${s.store_id.slice(0, 6)}`,
    revenue: Number(s.total_revenue || 0),
    orders: s.total_orders,
    color: storeColors[idx % storeColors.length]!,
  }));

  const maxStoreRevenue = Math.max(...displayRevenuePerStore.map((s) => s.revenue), 1);

  // Real-time top selling items
  const itemColors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
  const rawTopItems = analytics?.topSellingItems || [];
  const displayTopItems = rawTopItems.length > 0
    ? rawTopItems.map((item, idx) => ({
        name: item.item_name,
        count: item.total_quantity_sold,
        revenue: item.total_revenue,
        color: itemColors[idx % itemColors.length]!,
      }))
    : [];

  const maxItemCount = Math.max(...displayTopItems.map((i) => i.count), 1);

  return (
    <AdminGuard>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
        <AdminSidebar />

      <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 4 }, overflowY: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' } }}>
              Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              100% Real-time business insights and revenue metrics across all stores
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              icon={<StorageIcon sx={{ fontSize: '1rem !important', color: '#15803D !important' }} />}
              label="Real-Time PostgreSQL Live"
              size="small"
              sx={{
                borderRadius: '8px',
                fontWeight: 700,
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #BBF7D0',
              }}
            />

            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{
                borderRadius: '10px',
                borderColor: '#CBD5E1',
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                '&:hover': { borderColor: '#3B82F6', color: '#3B82F6' },
              }}
            >
              {isFetching ? 'Refreshing...' : 'Refresh Live Data'}
            </Button>
          </Box>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {(error as Error)?.message || 'Failed to fetch analytics'}
          </Alert>
        )}

        {/* 3 Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Orders */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Orders
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 1 }}>
                {summary.totalOrders}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                <TrendingUpIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Live Order Count
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Total Revenue */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 1 }}>
                ${Number(summary.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                <TrendingUpIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Real-time Net Gross
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Average Order Value */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Average Order Value
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 1 }}>
                ${avgOrderValue}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                <TrendingUpIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Per-Transaction Average
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section: Orders Per Day & Revenue Per Store */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Orders Per Day Bar Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Orders Per Day
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Live Daily Trend
                </Typography>
              </Box>

              {displayOrdersPerDay.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8' }}>
                  <Typography variant="body2">No daily orders recorded yet</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, pt: 2, px: 2 }}>
                  {displayOrdersPerDay.map((item) => {
                    const barHeight = Math.max((item.count / maxDailyCount) * 120, 12);
                    return (
                      <Box key={item.day} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem' }}>
                          {item.count}
                        </Typography>
                        <Box
                          sx={{
                            width: 32,
                            height: barHeight,
                            backgroundColor: '#3B82F6',
                            borderRadius: '6px 6px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                          {item.day}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Card>
          </Grid>

          {/* Revenue Per Store Bar Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Revenue Per Store
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  {displayRevenuePerStore.length} Active Stores
                </Typography>
              </Box>

              {displayRevenuePerStore.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8' }}>
                  <Typography variant="body2">No store revenue recorded yet</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 180, pt: 2, px: 2 }}>
                  {displayRevenuePerStore.map((item) => {
                    const barHeight = Math.max((item.revenue / maxStoreRevenue) * 120, 12);
                    return (
                      <Box key={item.store} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                          ${item.revenue.toFixed(0)}
                        </Typography>
                        <Box
                          sx={{
                            width: 52,
                            height: barHeight,
                            backgroundColor: item.color,
                            borderRadius: '8px 8px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                        />
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            color: '#334155',
                            fontWeight: 600,
                            maxWidth: 90,
                            textAlign: 'center',
                            display: 'block',
                          }}
                          title={item.store}
                        >
                          {item.store}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Top 5 Selling Items Horizontal Bar Chart */}
        <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 3 }}>
            Top 5 Selling Items
          </Typography>

          {displayTopItems.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: '#94A3B8' }}>
              <Typography variant="body2">No sales items recorded yet. Create orders in POS to populate live metrics.</Typography>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {displayTopItems.map((item) => (
                <Box key={item.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>
                      {item.count} sold (${Number(item.revenue).toFixed(2)})
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(item.count / maxItemCount) * 100}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': { backgroundColor: item.color, borderRadius: 5 },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Card>
      </Box>
    </Box>
    </AdminGuard>
  );
}
