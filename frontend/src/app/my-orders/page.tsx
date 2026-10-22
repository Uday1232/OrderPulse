'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Pagination,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { Order, OrderStatus, PaginationMeta } from '../../types/order';
import { useOrderSocket } from '../../context/SocketContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useStores } from '../../hooks/useStores';

export default function MyOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const { activePreparedOrder } = useOrderSocket();
  const { stores } = useStores();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [storeFilter, setStoreFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await ApiService.getMyOrders({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        store_id: storeFilter !== 'ALL' ? storeFilter : undefined,
        page,
        limit: 5,
      });

      if (res && Array.isArray(res.data)) {
        setOrders(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        } else {
          setPagination({
            total: res.data.length,
            page,
            limit: 5,
            totalPages: Math.max(1, Math.ceil(res.data.length / 5)),
          });
        }
        localStorage.setItem('sp_my_orders', JSON.stringify(res.data));
      }
    } catch (err: unknown) {
      // Fallback: If local storage has orders, try filtering them
      try {
        const stored = localStorage.getItem('sp_my_orders');
        if (stored) {
          const parsed: Order[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let filtered = parsed;
            if (statusFilter !== 'ALL') {
              filtered = filtered.filter((o) => o.status === statusFilter);
            }
            if (storeFilter !== 'ALL') {
              filtered = filtered.filter((o) => o.store_id === storeFilter);
            }
            if (debouncedSearch.trim()) {
              const q = debouncedSearch.toLowerCase();
              filtered = filtered.filter((o) => o.id.toLowerCase().includes(q));
            }
            setOrders(filtered);
            setPagination({
              total: filtered.length,
              page: 1,
              limit: 5,
              totalPages: Math.max(1, Math.ceil(filtered.length / 5)),
            });
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      setErrorMsg((err as Error)?.message || 'Failed to fetch your orders');
    } finally {
      setIsLoading(false);
    }
  }, [user, debouncedSearch, statusFilter, storeFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, storeFilter]);

  // If a live status update fires, refresh orders list
  useEffect(() => {
    if (activePreparedOrder) {
      fetchOrders();
    }
  }, [activePreparedOrder, fetchOrders]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'Order Placed', icon: <PendingActionsIcon sx={{ fontSize: 16 }} /> };
      case 'PREPARING':
        return { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA', label: 'In Kitchen (Preparing)', icon: <AutorenewIcon sx={{ fontSize: 16 }} /> };
      case 'PREPARED':
        return { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Prepared / Ready', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> };
      case 'COMPLETED':
        return { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Ready / Completed', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> };
      case 'CANCELLED':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Cancelled', icon: <CancelIcon sx={{ fontSize: 16 }} /> };
      default:
        return { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0', label: status, icon: null };
    }
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <Box sx={{ minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC', py: 8 }}>
        <Container maxWidth="sm">
          <Card
            sx={{
              p: 5,
              borderRadius: '24px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
              border: '1px solid #E2E8F0',
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '20px',
                backgroundColor: '#FFF7ED',
                color: '#FF7A00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <ShoppingBagIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              Sign In to View My Orders
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 4, lineHeight: 1.6 }}>
              Please sign in with your customer account to view your past orders, active tickets, and live kitchen preparation updates.
            </Typography>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              fullWidth
              sx={{
                py: 1.4,
                borderRadius: '12px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                '&:hover': { backgroundColor: '#1E293B' },
              }}
            >
              Sign In to Your Account
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC', py: { xs: 2.5, sm: 4 } }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3.5,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '1.6rem', sm: '2rem' },
                }}
              >
                My Orders
              </Typography>
              <Chip
                label={`${pagination.total} ${pagination.total === 1 ? 'Order' : 'Orders'}`}
                size="small"
                sx={{
                  backgroundColor: '#FFEDD5',
                  color: '#EA580C',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              Backend-powered search, live status filtering, and digital receipts in real-time.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={fetchOrders}
              startIcon={<RefreshIcon />}
              variant="outlined"
              size="small"
              sx={{
                borderColor: '#CBD5E1',
                color: '#475569',
                fontWeight: 700,
                borderRadius: '12px',
                textTransform: 'none',
                px: 2,
                '&:hover': { backgroundColor: '#F1F5F9' },
              }}
            >
              Refresh
            </Button>
            <Button
              component={Link}
              href="/pos"
              variant="contained"
              size="small"
              sx={{
                backgroundColor: '#FF7A00',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: '12px',
                textTransform: 'none',
                px: 2.5,
                boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                '&:hover': { backgroundColor: '#E06500' },
              }}
            >
              + Place New Order
            </Button>
          </Box>
        </Box>

        {/* Backend Filtering & Search Bar Panel */}
        <Card
          sx={{
            p: 2,
            mb: 3.5,
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Search Input */}
            <Grid item xs={12} md={5}>
              <TextField
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by Order ID or item..."
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    backgroundColor: '#F8FAFC',
                  },
                }}
              />
            </Grid>

            {/* Status Filter Chips */}
            <Grid item xs={12} sm={7} md={4}>
              <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', py: 0.2 }}>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'PLACED', label: 'Placed' },
                  { id: 'PREPARED', label: 'Prepared' },
                  { id: 'CANCELLED', label: 'Cancelled' },
                ].map((st) => (
                  <Chip
                    key={st.id}
                    label={st.label}
                    onClick={() => setStatusFilter(st.id)}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      backgroundColor: statusFilter === st.id ? '#0F172A' : '#F1F5F9',
                      color: statusFilter === st.id ? '#FFFFFF' : '#475569',
                      '&:hover': {
                        backgroundColor: statusFilter === st.id ? '#1E293B' : '#E2E8F0',
                      },
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Store Filter Dropdown */}
            <Grid item xs={12} sm={5} md={3}>
              <FormControl size="small" fullWidth>
                <Select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <MenuItem value="ALL">All Stores ({stores.length})</MenuItem>
                  {stores.map((st) => (
                    <MenuItem key={st.id} value={st.id}>
                      {st.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>

        {/* Error message */}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }}>
            {errorMsg}
          </Alert>
        )}

        {/* Orders Listing State */}
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#FF7A00', mb: 2 }} />
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
              Loading your orders from backend...
            </Typography>
          </Box>
        ) : orders.length === 0 ? (
          <Card
            sx={{
              p: 6,
              borderRadius: '24px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#F8FAFC',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', mb: 1 }}>
              No Orders Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 400, mx: 'auto', mb: 3 }}>
              {debouncedSearch || statusFilter !== 'ALL' || storeFilter !== 'ALL'
                ? 'No orders match your filter criteria. Try clearing search or selecting a different status.'
                : "You haven't placed any orders yet. Visit our delicious menu and place your first meal!"}
            </Typography>
            {debouncedSearch || statusFilter !== 'ALL' || storeFilter !== 'ALL' ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchInput('');
                  setStatusFilter('ALL');
                  setStoreFilter('ALL');
                }}
                sx={{
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderColor: '#CBD5E1',
                  color: '#475569',
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                component={Link}
                href="/pos"
                variant="contained"
                sx={{
                  backgroundColor: '#FF7A00',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  px: 3,
                  '&:hover': { backgroundColor: '#E06500' },
                }}
              >
                Browse Menu
              </Button>
            )}
          </Card>
        ) : (
          <Stack spacing={2.5}>
            {orders.map((ord) => {
              const statusConfig = getStatusColor(ord.status);
              const itemsList = Array.isArray(ord.items) ? ord.items : [];
              const orderDate = new Date(ord.created_at).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card
                  key={ord.id}
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    borderRadius: '20px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.07)',
                      borderColor: '#CBD5E1',
                    },
                  }}
                >
                  {/* Top Bar: Order ID, Date, and Status */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
                          Order #{ord.id.slice(0, 8)}
                        </Typography>
                        <Chip
                          icon={<StorefrontIcon sx={{ fontSize: '14px !important' }} />}
                          label={ord.store?.name || 'Restaurant Outlet'}
                          size="small"
                          sx={{
                            backgroundColor: '#F8FAFC',
                            color: '#475569',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            border: '1px solid #E2E8F0',
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#94A3B8', mt: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {orderDate}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Status Badge */}
                    <Chip
                      icon={statusConfig.icon || undefined}
                      label={statusConfig.label}
                      sx={{
                        backgroundColor: statusConfig.bg,
                        color: statusConfig.color,
                        border: `1px solid ${statusConfig.border}`,
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        px: 0.5,
                        borderRadius: '10px',
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5, borderColor: '#F1F5F9' }} />

                  {/* Items Summary */}
                  <Box sx={{ my: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Items Ordered
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                      {itemsList.map((item, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <Box
                            sx={{
                              p: 1.2,
                              px: 1.6,
                              borderRadius: '10px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF7A00' }}>
                                {item.qty || item.quantity || 1}x
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.85rem' }}>
                                {item.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
                              ₹{Number((item.qty || item.quantity || 1) * (item.price || item.unit_price || 0)).toFixed(2)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 1.5, borderColor: '#F1F5F9' }} />

                  {/* Footer Total */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pt: 0.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                          Total Amount Paid
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                          ₹{Number(ord.total_amount).toFixed(2)}
                        </Typography>
                      </Box>
                      <Chip
                        label={ord.payment_method || 'CASH'}
                        size="small"
                        sx={{
                          backgroundColor: '#F1F5F9',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          borderRadius: '6px',
                        }}
                      />
                    </Box>
                  </Box>
                </Card>
              );
            })}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 4 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root.Mui-selected': {
                      backgroundColor: '#FF7A00',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      '&:hover': { backgroundColor: '#E06500' },
                    },
                  }}
                />
              </Box>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
