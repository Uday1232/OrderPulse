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
import { ApiService } from '../../services/api';
import { useStores } from '../../hooks/useStores';

export default function DashboardOverviewPage() {
  const { stores } = useStores();
  const [selectedStore, setSelectedStore] = useState<string>('all');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', selectedStore],
    queryFn: () => ApiService.getAnalytics(false),
  });

  const summary = data?.data?.summary || { totalOrders: 129, totalRevenue: 4825.5, totalStores: 3 };
  const ordersPerDay = data?.data?.ordersPerDay || [];

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Dashboard Content */}
      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Real-time overview of all stores and operations
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              sx={{
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#0F172A',
                '& fieldset': { borderColor: '#E2E8F0' },
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
                {stores.length || 3}
              </Typography>
              <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 700 }}>
                All operational
              </Typography>
            </Card>
          </Grid>

          {/* Pending Orders */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ p: 2.5, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Pending Orders
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#EA580C', my: 1 }}>
                12
              </Typography>
              <Typography variant="caption" sx={{ color: '#EA580C', fontWeight: 700 }}>
                Needs attention
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
                  Last 7 Days
                </Typography>
              </Box>

              {/* Simulated CSS Bar Chart */}
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 200, pt: 2, px: 2 }}>
                {[
                  { day: 'Oct 10', count: 18 },
                  { day: 'Oct 11', count: 24 },
                  { day: 'Oct 12', count: 16 },
                  { day: 'Oct 13', count: 32 },
                  { day: 'Oct 14', count: 28 },
                  { day: 'Oct 15', count: 38 },
                  { day: 'Oct 16', count: 22 },
                ].map((item) => (
                  <Box key={item.day} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem' }}>
                      {item.count}
                    </Typography>
                    <Box
                      sx={{
                        width: 34,
                        height: item.count * 4,
                        backgroundColor: '#3B82F6',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.4s ease',
                        '&:hover': { backgroundColor: '#2563EB' },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                      {item.day}
                    </Typography>
                  </Box>
                ))}
              </Box>
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
                  {summary.totalOrders} Total Orders
                </Typography>
              </Box>

              {/* Progress Breakdown */}
              <Stack spacing={2.5} sx={{ mt: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                      Completed
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>
                      88 (68%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={68}
                    sx={{ height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', '& .MuiLinearProgress-bar': { backgroundColor: '#10B981' } }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                      Preparing
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                      28 (22%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={22}
                    sx={{ height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', '& .MuiLinearProgress-bar': { backgroundColor: '#F59E0B' } }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                      Placed
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#3B82F6' }}>
                      12 (9%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={9}
                    sx={{ height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', '& .MuiLinearProgress-bar': { backgroundColor: '#3B82F6' } }}
                  />
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
