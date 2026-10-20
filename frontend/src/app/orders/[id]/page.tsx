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

function OrderDetailsContent() {
  const params = useParams();
  const rawId = params?.id;
  const orderId = Array.isArray(rawId) ? rawId[0] : (rawId as string) || '';
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
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
      <AdminSidebar />

      <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 4 }, overflowY: 'auto' }}>
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
                  color: '#FFFFFF !important',
                  fontWeight: 700,
                  borderRadius: '12px',
                  px: 3,
                  py: 1.1,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  '&:hover': { backgroundColor: '#1E293B' },
                  '&.Mui-disabled': {
                    backgroundColor: '#E2E8F0 !important',
                    color: '#94A3B8 !important',
                  },
                }}
              >
                {updateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Update Status'}
              </Button>
            </Box>

            {/* Two Cards: Order Information & Order Items */}
            <Grid container spacing={3} sx={{ mb: 3.5 }}>
              {/* Order Info Card */}
              <Grid item xs={12} md={5}>
                <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
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

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Payment Method
                      </Typography>
                      <Chip
                        label={order.payment_method || 'CASH'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          border: '1px solid #E2E8F0',
                        }}
                      />
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
                <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                    Order Items
                  </Typography>

                  <TableContainer sx={{ backgroundColor: '#FFFFFF !important', borderRadius: '12px', border: '1px solid #E2E8F0', overflowX: 'auto', boxShadow: 'none' }}>
                    <Table size="small" sx={{ minWidth: 440 }}>
                      <TableHead sx={{ backgroundColor: '#F8FAFC !important' }}>
                        <TableRow sx={{ backgroundColor: '#F8FAFC !important' }}>
                          <TableCell sx={{ fontWeight: 800, color: '#475569 !important', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FAFC !important', borderBottom: '1px solid #E2E8F0', py: 1.5 }}>
                            ITEM
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#475569 !important', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FAFC !important', borderBottom: '1px solid #E2E8F0', py: 1.5 }}>
                            QTY
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#475569 !important', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FAFC !important', borderBottom: '1px solid #E2E8F0', py: 1.5 }}>
                            UNIT PRICE
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#475569 !important', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', backgroundColor: '#F8FAFC !important', borderBottom: '1px solid #E2E8F0', py: 1.5 }}>
                            TOTAL
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody sx={{ backgroundColor: '#FFFFFF !important' }}>
                        {order.items.map((item, idx) => (
                          <TableRow
                            key={idx}
                            sx={{
                              backgroundColor: '#FFFFFF !important',
                              '&:hover': { backgroundColor: '#F8FAFC !important' },
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            <TableCell sx={{ py: 1.75, borderBottom: '1px solid #F1F5F9 !important', backgroundColor: 'transparent !important' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A !important' }}>
                                {item.name}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.75, borderBottom: '1px solid #F1F5F9 !important', backgroundColor: 'transparent !important' }}>
                              <Chip
                                label={`×${item.qty || item.quantity || 1}`}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  backgroundColor: '#F1F5F9 !important',
                                  color: '#1E293B !important',
                                  borderRadius: '6px',
                                  height: '24px',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#334155 !important', py: 1.75, borderBottom: '1px solid #F1F5F9 !important', backgroundColor: 'transparent !important' }}>
                              ${Number(item.price || item.unit_price || 0).toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0F172A !important', textAlign: 'right', py: 1.75, borderBottom: '1px solid #F1F5F9 !important', backgroundColor: 'transparent !important' }}>
                              ${Number((item.price || item.unit_price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      Total: <span style={{ color: '#FF7A00', fontWeight: 900, fontSize: '1.25rem' }}>${Number(order.total_amount).toFixed(2)}</span>
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
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                {(['PLACED', 'PENDING', 'PREPARED', 'CANCELLED'] as const).map((status) => {
                  const isSelected = selectedStatus === status;
                  const isCancel = status === 'CANCELLED';
                  return (
                    <Button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      variant={isSelected ? 'contained' : 'outlined'}
                      sx={{
                        borderRadius: '10px',
                        fontWeight: 700,
                        px: 3,
                        py: 1,
                        fontSize: '0.88rem',
                        transition: 'all 0.2s',
                        ...(isSelected
                          ? {
                              backgroundColor: isCancel ? '#EF4444' : '#FF7A00',
                              color: '#FFFFFF !important',
                              boxShadow: isCancel
                                ? '0 4px 14px rgba(239, 68, 68, 0.3)'
                                : '0 4px 14px rgba(255, 122, 0, 0.3)',
                              '&:hover': {
                                backgroundColor: isCancel ? '#DC2626' : '#E06500',
                              },
                            }
                          : {
                              backgroundColor: '#FFFFFF !important',
                              color: isCancel ? '#EF4444 !important' : '#334155 !important',
                              borderColor: isCancel ? '#FCA5A5 !important' : '#CBD5E1 !important',
                              borderWidth: '1.5px',
                              '&:hover': {
                                backgroundColor: isCancel ? '#FEF2F2 !important' : '#F8FAFC !important',
                                borderColor: isCancel ? '#EF4444 !important' : '#94A3B8 !important',
                              },
                            }),
                      }}
                    >
                      {status}
                    </Button>
                  );
                })}
              </Box>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function OrderDetailsPage() {
  return (
    <React.Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#3B82F6' }} />
        </Box>
      }
    >
      <OrderDetailsContent />
    </React.Suspense>
  );
}
