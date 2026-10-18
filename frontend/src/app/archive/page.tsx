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
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { ApiService } from '../../services/api';

export default function ArchiveOrdersPage() {
  const queryClient = useQueryClient();
  const [archivedResult, setArchivedResult] = useState<{ count: number } | null>(null);

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: () => ApiService.archiveOldOrders(30),
    onSuccess: (res) => {
      setArchivedResult({ count: res.data.archivedCount });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const DEMO_ARCHIVABLE = [
    { id: '1006-a82f', store: 'Central Store', date: '01 Aug 2026', total: 450.0 },
    { id: '1003-b93e', store: 'North Store', date: '18 Aug 2026', total: 300.0 },
    { id: '1002-c74d', store: 'South Store', date: '05 Sep 2026', total: 250.0 },
  ];

  return (
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

        {/* Informational Alert Box matching Image 2 Screen 9 */}
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
              label="Orders older than 30 days: 3 found"
              size="small"
              sx={{
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            />
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #F1F5F9' }}>
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
                {DEMO_ARCHIVABLE.map((item, idx) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>#{item.id}</TableCell>
                    <TableCell sx={{ color: '#334155' }}>{item.store}</TableCell>
                    <TableCell sx={{ color: '#64748B', fontSize: '0.85rem' }}>{item.date}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A', textAlign: 'right' }}>
                      ${item.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Action Button at Bottom Right */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 3 }}>
            <Button
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
              variant="contained"
              startIcon={<ArchiveIcon />}
              sx={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderRadius: '12px',
                px: 3,
                py: 1.2,
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                '&:hover': { backgroundColor: '#B91C1C' },
              }}
            >
              {archiveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Archive 3 Orders'}
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
