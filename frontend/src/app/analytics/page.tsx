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
import { ApiService } from '../../services/api';

export default function AnalyticsPage() {
  const queryClient = useQueryClient();

  // Fetch Analytics with React Query
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => ApiService.getAnalytics(false),
  });

  // Force refresh mutation to bust Redis cache
  const forceRefreshMutation = useMutation({
    mutationFn: () => ApiService.getAnalytics(true),
    onSuccess: (newData) => {
      queryClient.setQueryData(['analytics'], newData);
    },
  });

  const analytics = data?.data;
  const summary = analytics?.summary || { totalOrders: 128, totalRevenue: 48250, totalStores: 3 };
  const avgOrderValue = summary.totalOrders > 0 ? (summary.totalRevenue / summary.totalOrders).toFixed(2) : '37.60';

  const TOP_SELLING_DEFAULTS = [
    { name: 'Classic Burger', count: 45, color: '#3B82F6' },
    { name: 'Veg Pizza', count: 38, color: '#10B981' },
    { name: 'French Fries', count: 32, color: '#F59E0B' },
    { name: 'Cold Coffee', count: 28, color: '#EC4899' },
    { name: 'Sandwich', count: 25, color: '#8B5CF6' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
      <AdminSidebar />

      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Business insights and performance metrics across all stores
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              icon={<StorageIcon sx={{ fontSize: '1rem !important' }} />}
              label={analytics?.fromCache ? 'Redis Cached' : 'Live DB'}
              size="small"
              sx={{
                borderRadius: '8px',
                fontWeight: 700,
                backgroundColor: analytics?.fromCache ? '#DBEAFE' : '#DCFCE7',
                color: analytics?.fromCache ? '#1D4ED8' : '#15803D',
              }}
            />

            <Button
              onClick={() => forceRefreshMutation.mutate()}
              disabled={forceRefreshMutation.isPending || isFetching}
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
              {forceRefreshMutation.isPending ? 'Busting Cache...' : 'Refresh Cache'}
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

        {/* 3 Metric Cards matching Image 2 Screen 8 */}
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
                  +12% vs last week
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
                  +16% vs last week
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
                  +6% vs last week
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
                  Last 7 Days
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, pt: 2, px: 2 }}>
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
                        width: 32,
                        height: item.count * 3.6,
                        backgroundColor: '#3B82F6',
                        borderRadius: '6px 6px 0 0',
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

          {/* Revenue Per Store Bar Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Revenue Per Store
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Active Locations
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 180, pt: 2, px: 4 }}>
                {[
                  { store: 'Central', rev: 22, color: '#3B82F6' },
                  { store: 'North', rev: 16, color: '#FF7A00' },
                  { store: 'South', rev: 10, color: '#10B981' },
                ].map((item) => (
                  <Box key={item.store} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                      ${item.rev}k
                    </Typography>
                    <Box
                      sx={{
                        width: 56,
                        height: item.rev * 6,
                        backgroundColor: item.color,
                        borderRadius: '8px 8px 0 0',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                      {item.store}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Top 5 Selling Items Horizontal Bar Chart */}
        <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 3 }}>
            Top 5 Selling Items
          </Typography>

          <Stack spacing={2.5}>
            {TOP_SELLING_DEFAULTS.map((item) => (
              <Box key={item.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>
                    {item.count} sold
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(item.count / 50) * 100}
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
        </Card>
      </Box>
    </Box>
  );
}
