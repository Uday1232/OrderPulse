'use client';

import React, { useState } from 'react';
import {
  Container,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArchiveIcon from '@mui/icons-material/Archive';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StorageIcon from '@mui/icons-material/Storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiService } from '../../services/api';
import { AVAILABLE_STORES } from '../../types/order';

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveDays, setArchiveDays] = useState(30);
  const [archiveResult, setArchiveResult] = useState<{ count: number; days: number } | null>(null);

  // Fetch Analytics with React Query
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
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

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (days: number) => ApiService.archiveOldOrders(days),
    onSuccess: (res) => {
      setArchiveResult({ count: res.data.archivedCount, days: res.data.daysThreshold });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setArchiveDialogOpen(false);
    },
  });

  const handleForceRefresh = () => {
    forceRefreshMutation.mutate();
  };

  const handleExecuteArchive = () => {
    archiveMutation.mutate(archiveDays);
  };

  const analytics = data?.data;
  const summary = analytics?.summary;

  // Max quantity among top selling items for progress bar scaling
  const maxSoldQty = analytics?.topSellingItems
    ? Math.max(...analytics.topSellingItems.map((i) => i.total_quantity_sold), 1)
    : 1;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#F9FAFB' }}>
            System Analytics & Archival
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>
            Real-time multi-store performance, sales aggregations, and atomic database archival
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Cache Status Badge */}
          {analytics && (
            <Chip
              icon={<StorageIcon sx={{ fontSize: '0.9rem !important' }} />}
              label={analytics.fromCache ? 'Redis Cache: HIT' : 'Computed: Live DB'}
              size="small"
              sx={{
                backgroundColor: analytics.fromCache
                  ? 'rgba(59, 130, 246, 0.12)'
                  : 'rgba(16, 185, 129, 0.12)',
                color: analytics.fromCache ? '#60A5FA' : '#34D399',
                border: `1px solid ${analytics.fromCache ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                fontWeight: 700,
              }}
            />
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            disabled={isFetching || forceRefreshMutation.isPending}
            onClick={handleForceRefresh}
            sx={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
          >
            {forceRefreshMutation.isPending ? 'Recomputing...' : 'Bust Redis Cache'}
          </Button>

          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<ArchiveIcon />}
            onClick={() => setArchiveDialogOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Archive Old Orders
          </Button>
        </Box>
      </Box>

      {archiveResult && (
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon />}
          sx={{ mb: 3 }}
          onClose={() => setArchiveResult(null)}
        >
          Successfully moved <strong>{archiveResult.count} orders</strong> older than {archiveResult.days} days
          to the <code>orders_archive</code> table via an atomic database transaction.
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
          <CircularProgress color="primary" />
          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
            Computing multi-store analytics...
          </Typography>
        </Box>
      ) : isError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : 'Failed to load analytics.'}
        </Alert>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 0.5 }}>
                      Total Orders
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#F9FAFB' }}>
                      {summary?.totalOrders ?? 0}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      color: '#3B82F6',
                    }}
                  >
                    <ShoppingBagIcon />
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 0.5 }}>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#10B981' }}>
                      ${(summary?.totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10B981',
                    }}
                  >
                    <MonetizationOnIcon />
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 0.5 }}>
                      Avg Order Value
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#F59E0B' }}>
                      $
                      {summary && summary.totalOrders > 0
                        ? (summary.totalRevenue / summary.totalOrders).toFixed(2)
                        : '0.00'}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      color: '#F59E0B',
                    }}
                  >
                    <TrendingUpIcon />
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 0.5 }}>
                      Active Stores
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#A855F7' }}>
                      {summary?.totalStores ?? 0}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(168, 85, 247, 0.12)',
                      color: '#A855F7',
                    }}
                  >
                    <StorefrontIcon />
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Section: Revenue Per Store & Top Selling Items */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Store Revenue Breakdown */}
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Store Revenue Performance
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Store Name</TableCell>
                        <TableCell align="right">Orders</TableCell>
                        <TableCell align="right">Total Revenue</TableCell>
                        <TableCell align="right">Avg Ticket</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics?.revenuePerStore.map((store) => {
                        const storeDetails = AVAILABLE_STORES.find((s) => s.id === store.store_id);
                        return (
                          <TableRow key={store.store_id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#F9FAFB' }}>
                                {storeDetails?.name || store.store_id}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                {storeDetails?.location || store.store_id}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {store.total_orders}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>
                                ${store.total_revenue.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ color: '#D1D5DB' }}>
                                ${store.avg_order_value.toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            {/* Top 5 Selling Items */}
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Top 5 Selling Items
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mb: 2 }}>
                  Aggregated directly from PostgreSQL JSONB line items
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {analytics?.topSellingItems.map((item, idx) => {
                    const percentage = Math.round((item.total_quantity_sold / maxSoldQty) * 100);

                    return (
                      <Box key={item.item_name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#F3F4F6' }}>
                            #{idx + 1} {item.item_name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                            {item.total_quantity_sold} sold (${item.total_revenue.toFixed(2)})
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 7,
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: idx === 0 ? '#F59E0B' : idx === 1 ? '#10B981' : '#3B82F6',
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Section: Daily Orders and Revenue Breakdown */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Daily Orders Breakdown (Last 30 Days)
            </Typography>
            <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mb: 2 }}>
              Date-grouped aggregation of order volume and gross revenue
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Orders Count</TableCell>
                    <TableCell align="right">Daily Revenue</TableCell>
                    <TableCell align="right">Avg Revenue / Order</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics?.ordersPerDay.map((daily) => (
                    <TableRow key={daily.date} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#F3F4F6' }}>
                        {daily.date}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${daily.order_count} orders`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#E5E7EB',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>
                          ${daily.daily_revenue.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                          ${(daily.daily_revenue / daily.order_count).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {/* Confirmation Dialog for Archival */}
      <Dialog
        open={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#F9FAFB' }}>
          Archive Historical Orders
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2.5 }}>
            This will execute an atomic database transaction moving orders older than the selected
            threshold from the active <code>orders</code> table into the <code>orders_archive</code>{' '}
            table. Active caches will be automatically invalidated.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Days Threshold"
            type="number"
            inputProps={{ min: 1 }}
            value={archiveDays}
            onChange={(e) => setArchiveDays(parseInt(e.target.value, 10) || 30)}
            helperText="Orders older than this number of days will be moved"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setArchiveDialogOpen(false)}
            sx={{ color: '#9CA3AF' }}
            disabled={archiveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleExecuteArchive}
            disabled={archiveMutation.isPending}
            startIcon={archiveMutation.isPending && <CircularProgress size={16} color="inherit" />}
          >
            {archiveMutation.isPending ? 'Archiving...' : 'Confirm Archival'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
