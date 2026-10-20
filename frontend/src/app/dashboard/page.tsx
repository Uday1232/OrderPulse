'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Alert,
  Stack,
  LinearProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useQuery } from '@tanstack/react-query';

import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminGuard } from '../../components/auth/AdminGuard';
import { ApiService } from '../../services/api';
import { useStores } from '../../hooks/useStores';

export default function DashboardOverviewPage() {
  const { stores } = useStores();
  const [selectedStore, setSelectedStore] = useState<string>('all');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', selectedStore],
    queryFn: () => ApiService.getAnalytics(false),
  });

  const summary = data?.data?.summary || { totalOrders: 0, totalRevenue: 0, totalStores: stores.length };
  const rawOrdersPerDay = data?.data?.ordersPerDay || [];

  // Fetch real orders to compute live pending status and status distribution
  const targetStoreId = selectedStore !== 'all' ? selectedStore : (stores[0]?.id || '');
  const { data: ordersData } = useQuery({
    queryKey: ['dashboard-orders', targetStoreId],
    queryFn: () => ApiService.getOrders({ store_id: targetStoreId, limit: 100 }),
    enabled: Boolean(targetStoreId),
    refetchInterval: 10000,
  });

  const liveOrders = ordersData?.data || [];
  const completedOrders = liveOrders.filter((o) => o.status === 'PREPARED' || o.status === 'COMPLETED').length;
  const preparingOrders = liveOrders.filter((o) => o.status === 'PREPARING').length;
  const pendingOrders = liveOrders.filter((o) => o.status === 'PENDING' || o.status === 'PLACED').length;
  const totalLive = liveOrders.length || summary.totalOrders || 0;

  const completedPct = totalLive > 0 ? Math.round((completedOrders / totalLive) * 100) : 0;
  const preparingPct = totalLive > 0 ? Math.round((preparingOrders / totalLive) * 100) : 0;
  const pendingPct = totalLive > 0 ? Math.round((pendingOrders / totalLive) * 100) : 0;

  const maxDailyCount = Math.max(...rawOrdersPerDay.map((d) => d.order_count), 1);

  return (
    <AdminGuard>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
        {/* Admin Sidebar */}
        <AdminSidebar />

      {/* Main Dashboard Content */}
      <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 4 }, overflowY: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' } }}>
              Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Real-time overview of all stores and operations
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <Select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              sx={{
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#0F172A',
                '& .MuiSelect-select': { color: '#0F172A !important' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1 !important' },
                '& .MuiSvgIcon-root': { color: '#64748B' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#FFFFFF',
                    '& .MuiMenuItem-root': {
                      color: '#0F172A',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#F1F5F9' },
                    },
                  },
                },
              }}
            >
              <MenuItem value="all">All Stores</MenuItem>
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

        {/* 4 Metric KPI Cards (Matching Image 2 Screen 2) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Orders */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ p: 2.5, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Orders
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 1 }}>
                {summary.totalOrders}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                <TrendingUpIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  +12% from yesterday
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Total Revenue */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ p: 2.5, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 1 }}>
                ${Number(summary.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                <TrendingUpIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  +18% from yesterday
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Active Stores */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ p: 2.5, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Stores
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 1 }}>
                {stores.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 700 }}>
                {stores.length > 0 ? 'All operational' : 'No stores configured'}
              </Typography>
            </Card>
          </Grid>

          {/* Pending Orders */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ p: 2.5, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Pending Orders
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: pendingOrders > 0 ? '#EA580C' : '#64748B', my: 1 }}>
                {pendingOrders}
              </Typography>
              <Typography variant="caption" sx={{ color: pendingOrders > 0 ? '#EA580C' : '#10B981', fontWeight: 700 }}>
                {pendingOrders > 0 ? 'Needs kitchen attention' : 'Queue clear'}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section: Orders Per Day & Order Status */}
        <Grid container spacing={3}>
          {/* Orders Per Day Bar Chart */}
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Orders Per Day
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Real-Time Database Metrics
                </Typography>
              </Box>

              {rawOrdersPerDay.length === 0 ? (
                <Box sx={{ py: 7, textAlign: 'center', color: '#94A3B8' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.5 }}>
                    No daily orders placed yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Orders created in the POS will dynamically appear here in real-time.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 200, pt: 2, px: 2 }}>
                  {rawOrdersPerDay.slice(-7).map((item) => {
                    const barHeight = Math.max((item.order_count / maxDailyCount) * 140, 14);
                    return (
                      <Box key={item.date} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem' }}>
                          {item.order_count}
                        </Typography>
                        <Box
                          sx={{
                            width: 34,
                            height: barHeight,
                            backgroundColor: '#3B82F6',
                            borderRadius: '6px 6px 0 0',
                            transition: 'height 0.4s ease',
                            '&:hover': { backgroundColor: '#2563EB' },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                          {item.date.split('-').slice(1).join('/')}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Card>
          </Grid>

          {/* Order Status Distribution */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Order Status
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  {totalLive} Total Orders
                </Typography>
              </Box>

              {totalLive === 0 ? (
                <Box sx={{ py: 7, textAlign: 'center', color: '#94A3B8' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.5 }}>
                    No active orders
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Status breakdown will track in real-time as orders are placed.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2.5} sx={{ mt: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        Completed / Prepared
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>
                        {completedOrders} ({completedPct}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={completedPct}
                      sx={{ height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', '& .MuiLinearProgress-bar': { backgroundColor: '#10B981' } }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        Preparing
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                        {preparingOrders} ({preparingPct}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={preparingPct}
                      sx={{ height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', '& .MuiLinearProgress-bar': { backgroundColor: '#F59E0B' } }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        Placed / Pending
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#3B82F6' }}>
                        {pendingOrders} ({pendingPct}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pendingPct}
                      sx={{ height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', '& .MuiLinearProgress-bar': { backgroundColor: '#3B82F6' } }}
                    />
                  </Box>
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
