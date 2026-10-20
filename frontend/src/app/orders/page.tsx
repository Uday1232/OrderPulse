'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminGuard } from '../../components/auth/AdminGuard';
import { useStores } from '../../hooks/useStores';
import { useOrders } from '../../hooks/useOrders';
import { useDebounce } from '../../hooks/useDebounce';
import { OrderStatus } from '../../types/order';

export default function OrdersListPage() {
  const { stores } = useStores();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Set initial store
  React.useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0]!.id);
    }
  }, [stores, selectedStore]);

  const { orders, isLoading, isError, error, pagination } = useOrders({
    storeId: selectedStore,
    status: statusFilter,
    limit: 10,
  });

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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
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
              onChange={(e) => setSelectedStore(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
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
            placeholder="Search order ID..."
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
              {orders.map((order, idx) => {
                const statusStyle = getStatusColor(order.status);
                const itemsCount = order.items.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);

                return (
                  <TableRow key={order.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell sx={{ color: '#334155' }}>
                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>
                      ${Number(order.total_amount).toFixed(2)}
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
      </Box>
    </Box>
    </AdminGuard>
  );
}
