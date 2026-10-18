'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  Button,
  Divider,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LockIcon from '@mui/icons-material/Lock';
import UpdateIcon from '@mui/icons-material/Update';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ViewListIcon from '@mui/icons-material/ViewList';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useOrderSocket } from '../../context/SocketContext';
import { ApiService } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Order, OrderStatus, AVAILABLE_STORES } from '../../types/order';

const ORDER_STEPS: OrderStatus[] = ['PLACED', 'PREPARING', 'COMPLETED'];

function UpdateOrderStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParamOrderId = searchParams.get('orderId') || '';

  const { currentStoreId, socket } = useOrderSocket();
  const queryClient = useQueryClient();

  const [inputOrderId, setInputOrderId] = useState<string>(queryParamOrderId);
  const [activeOrderId, setActiveOrderId] = useState<string>(queryParamOrderId);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('PREPARING');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync with URL query parameter changes
  useEffect(() => {
    if (queryParamOrderId) {
      setInputOrderId(queryParamOrderId);
      setActiveOrderId(queryParamOrderId);
    }
  }, [queryParamOrderId]);

  // Fetch recent orders for active store to provide a quick selection list
  const { data: recentOrdersData, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['recentOrdersForSelect', currentStoreId],
    queryFn: () => ApiService.getOrders({ store_id: currentStoreId, limit: 6 }),
  });

  // Query order by active ID
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isOrderError,
    error: orderError,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ['order', activeOrderId],
    queryFn: () => ApiService.getOrderById(activeOrderId),
    enabled: Boolean(activeOrderId && activeOrderId.trim().length >= 10),
    retry: false,
  });

  const order: Order | undefined = orderData?.data;

  // Keep targetStatus in sync when order loads
  useEffect(() => {
    if (order) {
      if (order.status === 'PLACED') setTargetStatus('PREPARING');
      else if (order.status === 'PREPARING') setTargetStatus('COMPLETED');
      else setTargetStatus('COMPLETED');
    }
  }, [order?.id, order?.status]);

  // Real-time listener: if the active order is updated via WebSocket, update state instantly
  useEffect(() => {
    if (!socket || !activeOrderId) return;

    const handleOrderUpdated = (updatedOrder: unknown) => {
      const typed = updatedOrder as Order;
      if (typed && typed.id === activeOrderId) {
        queryClient.setQueryData(['order', activeOrderId], { success: true, data: typed });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        setSuccessMessage(`Order updated to ${typed.status} via real-time WebSocket event.`);
      }
    };

    socket.on('order:updated', handleOrderUpdated);
    return () => {
      socket.off('order:updated', handleOrderUpdated);
    };
  }, [socket, activeOrderId, queryClient]);

  // Mutation to update order status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ApiService.updateOrderStatus(id, status),
    onSuccess: (res) => {
      setSuccessMessage(res.message || `Status successfully updated to ${res.data.status}`);
      setErrorMessage(null);
      queryClient.setQueryData(['order', res.data.id], { success: true, data: res.data });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update order status');
      setSuccessMessage(null);
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputOrderId.trim();
    if (!cleanId) return;
    setActiveOrderId(cleanId);
    setSuccessMessage(null);
    setErrorMessage(null);
    router.replace(`/update-order-status?orderId=${encodeURIComponent(cleanId)}`);
  };

  const handleSelectOrder = (selectedId: string) => {
    setInputOrderId(selectedId);
    setActiveOrderId(selectedId);
    setSuccessMessage(null);
    setErrorMessage(null);
    router.replace(`/update-order-status?orderId=${encodeURIComponent(selectedId)}`);
  };

  const handleApplyStatusChange = () => {
    if (!activeOrderId || !targetStatus) return;
    setSuccessMessage(null);
    setErrorMessage(null);
    updateStatusMutation.mutate({ id: activeOrderId, status: targetStatus });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    return ORDER_STEPS.indexOf(order.status);
  }, [order?.status]);

  const storeInfo = useMemo(() => {
    if (!order) return null;
    return AVAILABLE_STORES.find((s) => s.id === order.store_id);
  }, [order?.store_id]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header & Navigation */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: '#9CA3AF',
              mb: 1,
              px: 0,
              '&:hover': { color: '#F59E0B', backgroundColor: 'transparent' },
            }}
          >
            Back to Orders List
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UpdateIcon sx={{ color: '#F59E0B', fontSize: '2rem' }} />
            Update Order Status
          </Typography>
          <Typography variant="body1" sx={{ color: '#9CA3AF', mt: 0.5 }}>
            Manage order workflow lifecycle with PostgreSQL row-level concurrency locking and real-time synchronization.
          </Typography>
        </Box>

        <Chip
          icon={<LockIcon sx={{ fontSize: '1rem !important', color: '#10B981' }} />}
          label="Row-Level Lock Protected (SELECT ... FOR UPDATE)"
          sx={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#34D399',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontWeight: 600,
          }}
        />
      </Box>

      {/* Lookup Bar & Quick Selector */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <form onSubmit={handleSearchSubmit}>
          <Typography variant="subtitle2" sx={{ color: '#E5E7EB', fontWeight: 700, mb: 1.5 }}>
            Enter Order UUID or Select Below
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. 757bf312-4a48-4744-9365-299596cc60f8"
              value={inputOrderId}
              onChange={(e) => setInputOrderId(e.target.value)}
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 360 } }}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchIcon />}
              sx={{
                backgroundColor: '#F59E0B',
                color: '#111827',
                fontWeight: 700,
                px: 3,
                '&:hover': { backgroundColor: '#D97706' },
              }}
            >
              Lookup Order
            </Button>
          </Box>
        </form>

        {/* Quick Recent Orders Chips */}
        {recentOrdersData?.data && recentOrdersData.data.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mb: 1, fontWeight: 600 }}>
              Recent Orders from Current Store ({AVAILABLE_STORES.find((s) => s.id === currentStoreId)?.name}):
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {recentOrdersData.data.map((o) => (
                <Chip
                  key={o.id}
                  label={`${o.id.slice(0, 8)}... (${o.status})`}
                  clickable
                  onClick={() => handleSelectOrder(o.id)}
                  color={o.id === activeOrderId ? 'warning' : 'default'}
                  variant={o.id === activeOrderId ? 'filled' : 'outlined'}
                  size="small"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Card>

      {/* Feedback Alerts */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(null)}
          sx={{ mb: 3, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage(null)}
          sx={{ mb: 3, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Loading State */}
      {isLoadingOrder && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#F59E0B' }} />
          <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 2 }}>
            Fetching order details from database...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {isOrderError && (
        <Card sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <Typography variant="h6" sx={{ color: '#F87171', fontWeight: 700, mb: 1 }}>
            Order Not Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>
            {(orderError as Error)?.message || `No order found with UUID "${activeOrderId}".`}
          </Typography>
          <Button variant="outlined" color="warning" onClick={() => setInputOrderId('')}>
            Clear Search
          </Button>
        </Card>
      )}

      {/* Main Order Details & Status Transition Card */}
      {order && (
        <Grid container spacing={4}>
          {/* Left Column: Order Summary & Item Breakdown */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                p: 3.5,
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                height: '100%',
              }}
            >
              {/* Order Meta Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Order Details
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#FFFFFF' }}>
                      {order.id}
                    </Typography>
                    <Tooltip title={copied ? 'Copied!' : 'Copy UUID'}>
                      <IconButton size="small" onClick={() => handleCopyId(order.id)} sx={{ color: '#9CA3AF' }}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <StatusBadge status={order.status} />
              </Box>

              {/* Store & Date Info */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3, p: 2, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StorefrontIcon sx={{ fontSize: '0.9rem', color: '#F59E0B' }} /> Store
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#E5E7EB' }}>
                    {storeInfo?.name || order.store_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                    Created Timestamp
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#E5E7EB' }}>
                    {new Date(order.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Order Items Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#E5E7EB', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FastfoodIcon sx={{ color: '#F59E0B', fontSize: '1.1rem' }} />
                Items Breakdown ({order.items.length})
              </Typography>
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none', mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: 'rgba(255, 255, 255, 0.08)', color: '#9CA3AF', fontWeight: 700 } }}>
                      <TableCell>Item</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, idx) => (
                      <TableRow key={idx} sx={{ '& td': { borderColor: 'rgba(255, 255, 255, 0.05)', color: '#E5E7EB' } }}>
                        <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                        <TableCell align="center">{item.quantity || item.qty || 1}x</TableCell>
                        <TableCell align="right">${Number(item.unit_price || item.price || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                          ${Number(item.subtotal || ((item.quantity || item.qty || 1) * (item.unit_price || item.price || 0))).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 2 }} />

              {/* Total Amount */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ color: '#9CA3AF', fontWeight: 600 }}>
                  Total Bill Amount:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981' }}>
                  ${Number(order.total_amount).toFixed(2)}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Right Column: Interactive Status Transition Panel */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                p: 3.5,
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 2 }}>
                  Transition Order Status
                </Typography>

                {/* Progress Stepper */}
                <Stepper activeStep={currentStepIndex} alternativeLabel sx={{ mb: 4 }}>
                  {ORDER_STEPS.map((label, idx) => (
                    <Step key={label} completed={idx <= currentStepIndex}>
                      <StepLabel
                        sx={{
                          '& .MuiStepLabel-label': {
                            color: idx <= currentStepIndex ? '#F59E0B' : '#6B7280',
                            fontWeight: idx === currentStepIndex ? 800 : 500,
                            fontSize: '0.8rem',
                          },
                          '& .Mui-completed': { color: '#10B981 !important' },
                          '& .Mui-active': { color: '#F59E0B !important' },
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Status Selection */}
                <Typography variant="subtitle2" sx={{ color: '#E5E7EB', fontWeight: 700, mb: 1.5 }}>
                  Select New Target Status:
                </Typography>
                <RadioGroup
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      mb: 1.5,
                      backgroundColor: targetStatus === 'PLACED' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: targetStatus === 'PLACED' ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 2,
                    }}
                  >
                    <FormControlLabel
                      value="PLACED"
                      control={<Radio sx={{ color: '#3B82F6', '&.Mui-checked': { color: '#3B82F6' } }} />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#93C5FD' }}>
                            PLACED
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                            Order received, placed into the store queue.
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>

                  <Paper
                    sx={{
                      p: 1.5,
                      mb: 1.5,
                      backgroundColor: targetStatus === 'PREPARING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: targetStatus === 'PREPARING' ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 2,
                    }}
                  >
                    <FormControlLabel
                      value="PREPARING"
                      control={<Radio sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }} />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#FCD34D' }}>
                            PREPARING
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                            Kitchen accepted order; chef actively preparing food.
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>

                  <Paper
                    sx={{
                      p: 1.5,
                      mb: 2,
                      backgroundColor: targetStatus === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: targetStatus === 'COMPLETED' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 2,
                    }}
                  >
                    <FormControlLabel
                      value="COMPLETED"
                      control={<Radio sx={{ color: '#10B981', '&.Mui-checked': { color: '#10B981' } }} />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#6EE7B7' }}>
                            COMPLETED
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                            Order finished, packed, and served/delivered.
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                </RadioGroup>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ mt: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleApplyStatusChange}
                  disabled={updateStatusMutation.isPending || targetStatus === order.status}
                  startIcon={updateStatusMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                  sx={{
                    py: 1.5,
                    backgroundColor: '#F59E0B',
                    color: '#111827',
                    fontWeight: 800,
                    fontSize: '1rem',
                    '&:hover': { backgroundColor: '#D97706' },
                    '&.Mui-disabled': { backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#6B7280' },
                  }}
                >
                  {updateStatusMutation.isPending
                    ? 'Updating Status...'
                    : targetStatus === order.status
                    ? `Already ${order.status}`
                    : `Update Status to ${targetStatus}`}
                </Button>

                <Button
                  fullWidth
                  component={Link}
                  href="/"
                  startIcon={<ViewListIcon />}
                  sx={{
                    mt: 1.5,
                    color: '#9CA3AF',
                    '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                  }}
                >
                  View All Orders
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Empty State when no order is searched yet */}
      {!order && !isLoadingOrder && !isOrderError && (
        <Card
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: 'rgba(17, 24, 39, 0.5)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
          }}
        >
          <UpdateIcon sx={{ fontSize: '3rem', color: '#6B7280', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#E5E7EB', fontWeight: 700, mb: 1 }}>
            No Order Loaded
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', maxWidth: 480, mx: 'auto', mb: 3 }}>
            Enter an Order UUID in the search bar above or pick one of the recent orders to view its lifecycle and update its status.
          </Typography>
        </Card>
      )}
    </Container>
  );
}

export default function UpdateOrderStatusPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="xl" sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#F59E0B' }} />
        </Container>
      }
    >
      <UpdateOrderStatusContent />
    </Suspense>
  );
}
