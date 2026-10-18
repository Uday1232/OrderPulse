'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import LaunchIcon from '@mui/icons-material/Launch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useOrderSocket } from '../context/SocketContext';
import { useDebounce } from '../hooks/useDebounce';
import { ApiService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTransitionMenu } from '../components/StatusTransitionMenu';
import { OrderStatus, AVAILABLE_STORES } from '../types/order';

export default function OrdersListPage() {
  const { currentStoreId } = useOrderSocket();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [limit] = useState<number>(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeStore = useMemo(
    () => AVAILABLE_STORES.find((s) => s.id === currentStoreId) || AVAILABLE_STORES[0]!,
    [currentStoreId]
  );

  // Fetch orders with React Query
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['orders', currentStoreId, cursor, limit, selectedStatus],
    queryFn: () =>
      ApiService.getOrders({
        store_id: currentStoreId,
        cursor,
        limit,
        status: selectedStatus || undefined,
      }),
  });

  // Mutation to update order status
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) =>
      ApiService.updateOrderStatus(orderId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    await updateStatusMutation.mutateAsync({ orderId, newStatus });
  };

  const handleNextPage = () => {
    if (data?.pagination.nextCursor) {
      setCursorHistory((prev) => [...prev, cursor || '']);
      setCursor(data.pagination.nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prevCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory((prev) => prev.slice(0, prev.length - 1));
      setCursor(prevCursor || null);
    }
  };

  const handleFirstPage = () => {
    setCursor(null);
    setCursorHistory([]);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Client-side search filtering through debounced input
  const filteredOrders = useMemo(() => {
    if (!data?.data) return [];
    if (!debouncedSearch.trim()) return data.data;

    const query = debouncedSearch.toLowerCase().trim();
    return data.data.filter((order) => {
      const matchesId = order.id.toLowerCase().includes(query);
      const matchesItems = order.items.some((item) =>
        item.name.toLowerCase().includes(query)
      );
      const matchesAmount = order.total_amount.toString().includes(query);
      return matchesId || matchesItems || matchesAmount;
    });
  }, [data?.data, debouncedSearch]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" sx={{ color: '#F9FAFB', fontWeight: 800 }}>
              Orders Dashboard
            </Typography>
            <Paper
              sx={{
                px: 1.5,
                py: 0.5,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#FBBF24',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              {activeStore.name}
            </Paper>
          </Box>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>
            Real-time multi-store order streaming with cursor-based pagination and Redis caching
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Force refresh data">
            <IconButton
              onClick={() => refetch()}
              disabled={isFetching}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E5E7EB',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              <RefreshIcon sx={{ animation: isFetching ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </Tooltip>
          <Button
            component={Link}
            href="/create-order"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ fontWeight: 700 }}
          >
            Create Order
          </Button>
        </Stack>
      </Box>

      {/* Filter and Search Bar */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
          }}
        >
          {/* Status Filter Tabs */}
          <Tabs
            value={selectedStatus}
            onChange={(_e, val) => {
              setSelectedStatus(val);
              handleFirstPage();
            }}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                minHeight: 44,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#9CA3AF',
                '&.Mui-selected': {
                  color: '#F59E0B',
                },
              },
            }}
          >
            <Tab label="All Orders" value="" />
            <Tab label="Placed" value="PLACED" />
            <Tab label="Preparing" value="PREPARING" />
            <Tab label="Completed" value="COMPLETED" />
          </Tabs>

          {/* Search Input with useDebounce (500ms delay) */}
          <TextField
            placeholder="Search by ID, item, amount..."
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9CA3AF', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', md: 320 },
            }}
          />
        </Box>
      </Card>

      {/* Orders Table Card */}
      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
            <CircularProgress color="primary" />
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              Fetching orders from {activeStore.name}...
            </Typography>
          </Box>
        ) : isError ? (
          <Box sx={{ p: 4 }}>
            <Alert severity="error">
              {error instanceof Error ? error.message : 'Failed to load orders. Please try again.'}
            </Alert>
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#D1D5DB', mb: 1 }}>
              No orders found
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 3 }}>
              {debouncedSearch
                ? `No orders matching "${debouncedSearch}" in ${activeStore.name}`
                : `There are currently no orders for ${activeStore.name}.`}
            </Typography>
            <Button component={Link} href="/create-order" variant="contained" color="primary">
              Create an Order
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 750 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Items Ordered</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const formattedDate = new Date(order.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <TableRow
                        key={order.id}
                        hover
                        sx={{
                          transition: 'background-color 0.15s ease',
                          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02) !important' },
                        }}
                      >
                        {/* Order ID with Copy */}
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{order.id.slice(0, 8)}...</span>
                            <Tooltip title={copiedId === order.id ? 'Copied!' : 'Copy full UUID'}>
                              <IconButton
                                size="small"
                                onClick={() => handleCopyId(order.id)}
                                sx={{ color: copiedId === order.id ? '#10B981' : '#9CA3AF', p: 0.5 }}
                              >
                                {copiedId === order.id ? (
                                  <CheckIcon sx={{ fontSize: '0.9rem' }} />
                                ) : (
                                  <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* Items Breakdown */}
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {order.items.map((item, idx) => (
                              <Typography key={idx} variant="body2" sx={{ color: '#E5E7EB', fontSize: '0.85rem' }}>
                                <span style={{ color: '#F59E0B', fontWeight: 700 }}>{item.quantity}x</span>{' '}
                                {item.name} (${item.unit_price.toFixed(2)})
                              </Typography>
                            ))}
                          </Box>
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#F9FAFB' }}>
                            ${order.total_amount.toFixed(2)}
                          </Typography>
                        </TableCell>

                        {/* Status Chip */}
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
                            {formattedDate}
                          </Typography>
                        </TableCell>

                        {/* Row Actions: Status Transition */}
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                            <Tooltip title="Open Full Status Lifecycle Page">
                              <IconButton
                                component={Link}
                                href={`/update-order-status?orderId=${encodeURIComponent(order.id)}`}
                                size="small"
                                sx={{
                                  color: '#9CA3AF',
                                  '&:hover': { color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
                                }}
                              >
                                <LaunchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <StatusTransitionMenu
                              orderId={order.id}
                              currentStatus={order.status}
                              onUpdateStatus={handleUpdateStatus}
                            />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Cursor-Based Pagination Controls */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                Showing {filteredOrders.length} orders
                {cursor ? ` (Cursor: ${cursor.slice(0, 8)}...)` : ' (First page)'}
              </Typography>

              <Stack direction="row" spacing={1.5}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!cursor && cursorHistory.length === 0}
                  onClick={handleFirstPage}
                >
                  First Page
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  disabled={cursorHistory.length === 0}
                  onClick={handlePrevPage}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  disabled={!data?.pagination.hasMore}
                  onClick={handleNextPage}
                >
                  Next Page
                </Button>
              </Stack>
            </Box>
          </>
        )}
      </Card>
    </Container>
  );
}
