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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CloseIcon from '@mui/icons-material/Close';

import { AdminSidebar } from '../../../components/admin/AdminSidebar';
import { useStores } from '../../../hooks/useStores';

export default function StoresManagementPage() {
  const { stores, isLoading, isError, error, createStore, isCreating } = useStores();

  const [modalOpen, setModalOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateStore = async () => {
    if (!storeName.trim() || !storeLocation.trim()) {
      setFormError('Please enter both store name and location.');
      return;
    }

    setFormError(null);
    try {
      await createStore({ name: storeName.trim(), location: storeLocation.trim() });
      setSuccessMsg(`Store "${storeName}" created successfully!`);
      setStoreName('');
      setStoreLocation('');
      setModalOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to create store. Admin token required.');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
      <AdminSidebar />

      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Stores
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Manage multi-store locations and branch assignments
            </Typography>
          </Box>

          <Button
            onClick={() => setModalOpen(true)}
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
            Add Store
          </Button>
        </Box>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {(error as Error)?.message || 'Failed to fetch stores'}
          </Alert>
        )}

        {/* Stores Table matching Image 2 Screen 6 */}
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: 'none',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>STORE NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>LOCATION</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>CREATED AT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stores.map((store, idx) => (
                <TableRow key={store.id} hover>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
                      {store.name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#475569' }}>{store.location}</TableCell>
                  <TableCell>
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                    {store.created_at ? new Date(store.created_at).toLocaleDateString() : 'Active'}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      size="small"
                      sx={{
                        color: '#3B82F6',
                        fontWeight: 700,
                        textTransform: 'none',
                        '&:hover': { backgroundColor: '#EFF6FF' },
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Store Modal */}
        <Dialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Add New Store
            </Typography>
            <IconButton size="small" onClick={() => setModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
                {formError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Store Name"
                placeholder="e.g. Westside Cafe & Grill"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Location Address"
                placeholder="e.g. 888 Elm St, Westside"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} sx={{ color: '#64748B' }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateStore}
              disabled={isCreating}
              variant="contained"
              sx={{ backgroundColor: '#0F172A', color: '#FFFFFF', fontWeight: 700 }}
            >
              {isCreating ? <CircularProgress size={20} color="inherit" /> : 'Create Store'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
