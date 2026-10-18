'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AdminSidebar } from '../../../components/admin/AdminSidebar';
import { ApiService } from '../../../services/api';
import { OrderStatus } from '../../../types/order';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('PLACED');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ApiService.getOrderById(orderId),
    enabled: Boolean(orderId),
  });

  const order = data?.data;

  React.useEffect(() => {
    if (order?.status) {
      setSelectedStatus(order.status);
    }
  }, [order?.status]);

  const updateMutation = useMutation({
    mutationFn: (newStatus: OrderStatus) => ApiService.updateOrderStatus(orderId, newStatus),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setSuccessMsg(`Order status successfully updated to ${res.data.status}!`);
    },
  });

  const handleApplyStatusUpdate = async () => {
    await updateMutation.mutateAsync(selectedStatus);
  };

  const STEPS: Array<{ label: string; status: OrderStatus }> = [
    { label: 'Placed', status: 'PLACED' },
    { label: 'Preparing', status: 'PENDING' },
    { label: 'Completed', status: 'PREPARED' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
      <AdminSidebar />

      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {/* Back Link */}
        <Button
          component={Link}
          href="/orders"
          startIcon={<ArrowBackIcon />}
          sx={{ color: '#64748B', fontWeight: 600, mb: 2, textTransform: 'none' }}
        >
          Back to Orders
        </Button>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {(error as Error)?.message || 'Failed to load order details'}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {order && (
          <Box>
            {/* Header with Status and Action */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Order #{order.id.slice(0, 8)}
                </Typography>
                <Chip
                  label={order.status}
                  sx={{
                    fontWeight: 700,
                    borderRadius: '8px',
                    backgroundColor: order.status === 'PREPARED' ? '#DCFCE7' : '#DBEAFE',
                    color: order.status === 'PREPARED' ? '#15803D' : '#1D4ED8',
                  }}
                />
              </Box>

              <Button
                variant="contained"
                onClick={handleApplyStatusUpdate}
                disabled={updateMutation.isPending || selectedStatus === order.status}
                sx={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: '12px',
                  px: 3,
                  py: 1.1,
                  '&:hover': { backgroundColor: '#1E293B' },
                }}
              >
                {updateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Update Status'}
              </Button>
            </Box>

            {/* Two Cards: Order Information & Order Items */}
            <Grid container spacing={3} sx={{ mb: 3.5 }}>
              {/* Order Info Card */}
              <Grid item xs={12} md={5}>
                <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 2.5 }}>
                    Order Information
                  </Typography>

                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Order ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        #{order.id.slice(0, 8)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Store ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {order.store_id.slice(0, 8)}...
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Payment Method
                      </Typography>
                      <Chip label={order.payment_method || 'CASH'} size="small" sx={{ fontWeight: 700 }} />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Payment Status
                      </Typography>
                      <Chip
                        label={order.payment_status || 'COMPLETED'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: order.payment_status === 'COMPLETED' ? '#DCFCE7' : '#FEF3C7',
                          color: order.payment_status === 'COMPLETED' ? '#15803D' : '#B45309',
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Total Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#FF7A00' }}>
                        ${Number(order.total_amount).toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Created At
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {new Date(order.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              {/* Order Items Table Card */}
              <Grid item xs={12} md={7}>
                <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                    Order Items
                  </Typography>

                  <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #F1F5F9' }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>Item</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>Unit Price</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#64748B', textAlign: 'right' }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{item.name}</TableCell>
                            <TableCell sx={{ color: '#334155' }}>{item.qty || item.quantity || 1}</TableCell>
                            <TableCell sx={{ color: '#334155' }}>${Number(item.price || item.unit_price || 0).toFixed(2)}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#0F172A', textAlign: 'right' }}>
                              ${Number((item.price || item.unit_price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      Total: <span style={{ color: '#FF7A00' }}>${Number(order.total_amount).toFixed(2)}</span>
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* Bottom Card: Visual Stepper for Status Update */}
            <Card sx={{ p: 4, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 3 }}>
                Update Order Status (Row-Level Locked Transaction)
              </Typography>

              {/* Visual Horizontal Timeline / Stepper */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 600, mx: 'auto', mb: 4, position: 'relative' }}>
                {/* Horizontal line */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '10%',
                    right: '10%',
                    height: 4,
                    backgroundColor: '#E2E8F0',
                    zIndex: 0,
                    transform: 'translateY(-50%)',
                  }}
                />

                {STEPS.map((step, idx) => {
                  const isCurrent = order.status === step.status;
                  const isSelected = selectedStatus === step.status;

                  return (
                    <Box
                      key={step.label}
                      onClick={() => setSelectedStatus(step.status)}
                      sx={{
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#3B82F6' : '#FFFFFF',
                          border: `3px solid ${isSelected ? '#3B82F6' : '#CBD5E1'}`,
                          color: isSelected ? '#FFFFFF' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? '0 4px 14px rgba(59, 130, 246, 0.4)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{idx + 1}</Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? '#3B82F6' : '#64748B',
                          fontSize: '0.8rem',
                        }}
                      >
                        {step.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Status Radio Choices */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Button
                  onClick={() => setSelectedStatus('PLACED')}
                  variant={selectedStatus === 'PLACED' ? 'contained' : 'outlined'}
                  sx={{ borderRadius: '10px' }}
                >
                  PLACED
                </Button>
                <Button
                  onClick={() => setSelectedStatus('PENDING')}
                  variant={selectedStatus === 'PENDING' ? 'contained' : 'outlined'}
                  sx={{ borderRadius: '10px' }}
                >
                  PENDING
                </Button>
                <Button
                  onClick={() => setSelectedStatus('PREPARED')}
                  variant={selectedStatus === 'PREPARED' ? 'contained' : 'outlined'}
                  sx={{ borderRadius: '10px' }}
                >
                  PREPARED
                </Button>
                <Button
                  onClick={() => setSelectedStatus('CANCELLED')}
                  variant={selectedStatus === 'CANCELLED' ? 'contained' : 'outlined'}
                  color="error"
                  sx={{ borderRadius: '10px' }}
                >
                  CANCELLED
                </Button>
              </Box>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
}
