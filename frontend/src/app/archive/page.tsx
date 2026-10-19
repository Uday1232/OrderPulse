'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminGuard } from '../../components/auth/AdminGuard';
import { ApiService } from '../../services/api';

export default function ArchiveOrdersPage() {
  const queryClient = useQueryClient();
  const [archivedResult, setArchivedResult] = useState<{ count: number } | null>(null);

  // Fetch real archivable orders older than 30 days
  const { data: archivableData, isLoading } = useQuery({
    queryKey: ['archivable-orders'],
    queryFn: () => ApiService.getArchivableOrders(30),
  });

  const archivableOrders = archivableData?.data || [];

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: () => ApiService.archiveOldOrders(30),
    onSuccess: (res) => {
      setArchivedResult({ count: res.data.archivedCount });
      queryClient.invalidateQueries({ queryKey: ['archivable-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  return (
    <AdminGuard>
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
        <AdminSidebar />

      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ mb: 3.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Archive Old Orders
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Move orders older than 30 days to the archive table to optimize active database performance
          </Typography>
        </Box>

        {/* Informational Alert Box */}
        <Alert
          icon={<InfoOutlinedIcon sx={{ color: '#3B82F6' }} />}
          sx={{
            mb: 4,
            backgroundColor: '#EFF6FF',
            color: '#1E40AF',
            borderRadius: '14px',
            border: '1px solid #BFDBFE',
            fontSize: '0.9rem',
          }}
        >
          This will move all orders older than 30 days to the <strong>order_archives</strong> table. The original orders will be safely moved in an atomic PostgreSQL transaction.
        </Alert>

        {archivedResult && (
          <Alert
            severity="success"
            icon={<CheckCircleOutlineIcon />}
            sx={{ mb: 4, borderRadius: '14px' }}
            onClose={() => setArchivedResult(null)}
          >
            Successfully moved {archivedResult.count} orders to the archival database!
          </Alert>
        )}

        {/* Archivable Orders Table Card */}
        <Card sx={{ p: 3, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Orders to Archive
            </Typography>
            <Chip
              label={`Orders older than 30 days: ${archivableOrders.length} found`}
              size="small"
              sx={{
                backgroundColor: archivableOrders.length > 0 ? '#EFF6FF' : '#F1F5F9',
                color: archivableOrders.length > 0 ? '#2563EB' : '#64748B',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            />
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: 'none', overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>ORDER ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>STORE</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>CREATED AT</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', textAlign: 'right' }}>TOTAL AMOUNT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow sx={{ backgroundColor: '#FFFFFF' }}>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, backgroundColor: '#FFFFFF' }}>
                      <CircularProgress size={24} sx={{ color: '#3B82F6' }} />
                    </TableCell>
                  </TableRow>
                ) : archivableOrders.length === 0 ? (
                  <TableRow sx={{ backgroundColor: '#FFFFFF' }}>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, backgroundColor: '#FFFFFF' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.5 }}>
                        No orders older than 30 days found
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        All current active orders are within the standard 30-day window.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  archivableOrders.map((item, idx) => (
                    <TableRow key={item.id} sx={{ backgroundColor: '#FFFFFF', '&:hover': { backgroundColor: '#F8FAFC' } }}>
                      <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>#{item.id.slice(0, 8)}</TableCell>
                      <TableCell sx={{ color: '#0F172A', fontWeight: 600 }}>{item.store?.name || 'Store Location'}</TableCell>
                      <TableCell sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                        {new Date(item.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0F172A', textAlign: 'right' }}>
                        ${Number(item.total_amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Action Button at Bottom Right */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 3 }}>
            <Button
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending || archivableOrders.length === 0}
              variant="contained"
              startIcon={<ArchiveIcon />}
              sx={{
                backgroundColor: archivableOrders.length === 0 ? '#CBD5E1' : '#DC2626',
                color: archivableOrders.length === 0 ? '#64748B' : '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderRadius: '12px',
                px: 3,
                py: 1.2,
                boxShadow: archivableOrders.length === 0 ? 'none' : '0 4px 14px rgba(220, 38, 38, 0.35)',
                '&:hover': { backgroundColor: archivableOrders.length === 0 ? '#CBD5E1' : '#B91C1C' },
              }}
            >
              {archiveMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                `Archive ${archivableOrders.length} Orders`
              )}
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
    </AdminGuard>
  );
}

