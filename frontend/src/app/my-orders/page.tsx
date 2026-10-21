'use client';

import React, { useEffect, useState } from 'react';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { Order, OrderStatus } from '../../types/order';
import { useOrderSocket } from '../../context/SocketContext';

export default function MyOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const { activePreparedOrder } = useOrderSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.getMyOrders();
      setOrders(res.data || []);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to load your orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // If a live status update fires, refresh orders list
  useEffect(() => {
    if (activePreparedOrder) {
      fetchOrders();
    }
  }, [activePreparedOrder]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'Order Placed', icon: <PendingActionsIcon sx={{ fontSize: 16 }} /> };
      case 'PREPARING':
        return { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA', label: 'In Kitchen (Preparing)', icon: <AutorenewIcon sx={{ fontSize: 16 }} /> };
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
            mb: 4,
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
                label={`${orders.length} ${orders.length === 1 ? 'Order' : 'Orders'}`}
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
              Track your live meal preparation status, order history, and digital receipts in real-time.
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

        {/* Error message */}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }}>
            {errorMsg}
          </Alert>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#FF7A00' }} />
          </Box>
        )}

        {/* Empty Orders State */}
        {!isLoading && orders.length === 0 && (
          <Card
            sx={{
              p: 6,
              borderRadius: '24px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                backgroundColor: '#F1F5F9',
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
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
              No orders placed yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3, maxWidth: 360, mx: 'auto' }}>
              Explore our chef-curated menus, burgers, artisanal pizzas, and refreshing drinks!
            </Typography>
            <Button
              component={Link}
              href="/pos"
              variant="contained"
              sx={{
                backgroundColor: '#FF7A00',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: '12px',
                px: 3.5,
                py: 1,
                boxShadow: '0 4px 14px rgba(255, 122, 0, 0.3)',
                '&:hover': { backgroundColor: '#E06500' },
              }}
            >
              Browse Menu & Order
            </Button>
          </Card>
        )}

        {/* Orders Cards Grid */}
        {!isLoading && orders.length > 0 && (
          <Stack spacing={2.5}>
            {orders.map((ord) => {
              const statusInfo = getStatusColor(ord.status);
              const itemsList = Array.isArray(ord.items) ? (ord.items as any[]) : [];
              const orderDate = new Date(ord.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const orderTime = new Date(ord.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card
                  key={ord.id}
                  sx={{
                    borderRadius: '20px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                    p: { xs: 2.5, sm: 3 },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                      borderColor: '#CBD5E1',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      mb: 2,
                      gap: 1.5,
                    }}
                  >
                    {/* Store & Order Number */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorefrontIcon sx={{ color: '#FF7A00', fontSize: 20 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>
                          {ord.store?.name || 'Store Order'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                        Order ID: #{ord.id.slice(0, 8).toUpperCase()} • {orderDate} at {orderTime}
                      </Typography>
                    </Box>

                    {/* Status Badge */}
                    <Chip
                      icon={statusInfo.icon || undefined}
                      label={statusInfo.label}
                      sx={{
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color,
                        border: `1px solid ${statusInfo.border}`,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        px: 1,
                        py: 0.5,
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

                  {/* Footer Total & Tracking Action */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      pt: 0.5,
                      gap: 2,
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

                    <Button
                      component={Link}
                      href={`/orders/${ord.id}`}
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      size="small"
                      sx={{
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        borderRadius: '10px',
                        px: 2.5,
                        py: 0.9,
                        textTransform: 'none',
                        '&:hover': { backgroundColor: '#1E293B' },
                      }}
                    >
                      Track Live Status
                    </Button>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
