'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { useStores } from '@/hooks/useStores';
import { useOrders } from '@/hooks/useOrders';
import { useDebounce } from '@/hooks/useDebounce';
import { OrderStatus } from '@/types/order';

export default function OrdersListPage() {
  const { stores } = useStores();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Cursor pagination state
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Set initial store
  React.useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0]!.id);
    }
  }, [stores, selectedStore]);

  const { orders, isLoading, isFetching, isError, error, pagination, refetch } = useOrders({
    storeId: selectedStore,
    cursor,
    status: statusFilter,
    limit,
  });

  const handleStoreChange = (newStore: string) => {
    setSelectedStore(newStore);
    setCursor(null);
    setCursorHistory([null]);
    setPage(1);
  };

  const handleStatusChange = (newStatus: OrderStatus | '') => {
    setStatusFilter(newStatus);
    setCursor(null);
    setCursorHistory([null]);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCursor(null);
    setCursorHistory([null]);
    setPage(1);
  };

  const handleNext = () => {
    if (pagination?.hasMore && pagination.nextCursor) {
      setCursorHistory((prev) => [...prev, pagination.nextCursor]);
      setCursor(pagination.nextCursor);
      setPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      const updated = [...cursorHistory];
      updated.pop(); // pop current
      const prevCursor = updated[updated.length - 1] ?? null;
      setCursorHistory(updated);
      setCursor(prevCursor);
      setPage((prev) => prev - 1);
    }
  };

  const displayedOrders = useMemo(() => {
    if (!debouncedSearch.trim()) return orders;
    const term = debouncedSearch.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(term) ||
        (o.payment_method && o.payment_method.toLowerCase().includes(term)) ||
        o.status.toLowerCase().includes(term) ||
        (o.items && o.items.some((i) => i.name.toLowerCase().includes(term)))
    );
  }, [orders, debouncedSearch]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PREPARED':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'PLACED':
        return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'PENDING':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', text: '#B91C1C' };
      default:
        return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <AdminGuard>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'calc(100vh - 64px)', backgroundColor: '#F8FAFC' }}>
        <AdminSidebar />

      <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 4 }, overflowY: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' } }}>
              Orders
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              View and manage all real-time store orders
            </Typography>
          </Box>

          <Button
            component={Link}
            href="/pos"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: '12px',
              px: 2.5,
              py: 1.1,
              '&:hover': { backgroundColor: '#1E293B' },
            }}
          >
            Create Order
          </Button>
        </Box>

        {/* Filter Controls Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            flexWrap: 'wrap',
            backgroundColor: '#FFFFFF',
            p: 2,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Store Filter */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <Select
              value={selectedStore}
              onChange={(e) => handleStoreChange(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
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
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus | '')}
              displayEmpty
              sx={{
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
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
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PLACED">Placed</MenuItem>
              <MenuItem value="PREPARED">Prepared</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>

          {/* Search Bar */}
          <TextField
            size="small"
            placeholder="Search order ID or item..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#64748B', fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '10px',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                '& .MuiInputBase-input': { color: '#0F172A !important' },
                '& .MuiInputBase-input::placeholder': { color: '#64748B !important', opacity: 1 },
                '& fieldset': { borderColor: '#CBD5E1 !important' },
              },
            }}
            sx={{ flex: '1 1 200px' }}
          />
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {(error as Error)?.message || 'Failed to fetch orders'}
          </Alert>
        )}

        {/* Orders Table matching Image 2 Screen 4 */}
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: 'none',
            backgroundColor: '#FFFFFF',
            overflowX: 'auto',
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>ORDER ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>ITEMS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>TOTAL AMOUNT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>PAYMENT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>CREATED AT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedOrders.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#64748B', mb: 0.5 }}>
                      No orders found
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Try selecting a different store branch or clearing your search / status filter.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {displayedOrders.map((order, idx) => {
                const statusStyle = getStatusColor(order.status);
                const itemsCount = order.items.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);
                const rowNum = (page - 1) * limit + idx + 1;

                return (
                  <TableRow key={order.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{rowNum}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell sx={{ color: '#334155' }}>
                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.payment_method || 'CASH'}
                        size="small"
                        sx={{
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          backgroundColor: '#F1F5F9',
                          color: '#475569',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                      {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Button
                        component={Link}
                        href={`/orders/${order.id}`}
                        size="small"
                        sx={{
                          color: '#3B82F6',
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '0.85rem',
                          '&:hover': { backgroundColor: '#EFF6FF' },
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Control Bar at Bottom of Orders Table */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mt: 2.5,
            p: 2,
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          }}
        >
          {/* Left: Rows Per Page & Count Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>
                Rows per page:
              </Typography>
              <FormControl size="small">
                <Select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  sx={{
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    height: 34,
                    backgroundColor: '#F8FAFC',
                    '& .MuiSelect-select': { py: 0.5, px: 1.2 },
                    '& fieldset': { borderColor: '#CBD5E1' },
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem' }}>
              Showing <strong style={{ color: '#0F172A' }}>{displayedOrders.length}</strong> orders on Page <strong style={{ color: '#0F172A' }}>{page}</strong>
            </Typography>

            {isFetching && (
              <Chip
                label="Updating..."
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: '#EFF6FF',
                  color: '#3B82F6',
                }}
              />
            )}
          </Box>

          {/* Right: Prev / Next Pagination Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Button
              onClick={handlePrev}
              disabled={page === 1 || isFetching}
              startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.825rem',
                borderColor: '#CBD5E1',
                color: '#334155',
                px: 2,
                py: 0.6,
                '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F8FAFC' },
                '&.Mui-disabled': { borderColor: '#E2E8F0', color: '#94A3B8' },
              }}
            >
              Previous
            </Button>

            <Box
              sx={{
                minWidth: 34,
                height: 34,
                borderRadius: '8px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                px: 1,
              }}
            >
              {page}
            </Box>

            <Button
              onClick={handleNext}
              disabled={!pagination?.hasMore || isFetching}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.825rem',
                borderColor: '#CBD5E1',
                color: '#334155',
                px: 2,
                py: 0.6,
                '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F8FAFC' },
                '&.Mui-disabled': { borderColor: '#E2E8F0', color: '#94A3B8' },
              }}
            >
              Next
            </Button>

            <Tooltip title="Refresh Orders">
              <IconButton
                onClick={() => refetch()}
                disabled={isFetching}
                size="small"
                sx={{
                  color: '#64748B',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  p: 0.8,
                  '&:hover': { backgroundColor: '#F1F5F9', color: '#0F172A' },
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
    </AdminGuard>
  );
}
