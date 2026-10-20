'use client';

import React, { useState, useMemo } from 'react';
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
  Tooltip,
  Switch,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import { useSnackbar } from 'notistack';

import { AdminSidebar } from '../../../components/admin/AdminSidebar';
import { AdminGuard } from '../../../components/auth/AdminGuard';
import { useStores } from '../../../hooks/useStores';
import { Store } from '../../../types/order';

export default function StoresManagementPage() {
  const { stores, isLoading, isError, error, createStore, isCreating, updateStore, isUpdating, deleteStore, isDeleting } = useStores();
  const { enqueueSnackbar } = useSnackbar();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add Store State
  const [modalOpen, setModalOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [storeActive, setStoreActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Store State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreLocation, setEditStoreLocation] = useState('');
  const [editStoreActive, setEditStoreActive] = useState(true);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  // Stats calculation
  const totalStoresCount = stores.length;
  const activeStoresCount = stores.filter((s) => s.is_active !== false).length;
  const inactiveStoresCount = stores.filter((s) => s.is_active === false).length;

  // Filtered stores
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchesSearch =
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.location.toLowerCase().includes(searchQuery.toLowerCase());

      const isActive = store.is_active !== false;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isActive) ||
        (statusFilter === 'INACTIVE' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [stores, searchQuery, statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (store: Store) => {
    setEditingStore(store);
    setEditStoreName(store.name);
    setEditStoreLocation(store.location);
    setEditStoreActive(store.is_active !== false);
    setEditFormError(null);
    setEditModalOpen(true);
  };

  // Quick Toggle Active/Inactive
  const handleToggleStoreStatus = async (store: Store) => {
    const newStatus = !(store.is_active !== false);
    try {
      await updateStore({
        storeId: store.id,
        data: { is_active: newStatus },
      });
      enqueueSnackbar(
        `Store "${store.name}" is now ${newStatus ? 'Activated' : 'Deactivated'}.`,
        { variant: newStatus ? 'success' : 'info', autoHideDuration: 3500 }
      );
    } catch (err: unknown) {
      enqueueSnackbar((err as Error).message || 'Failed to update store status', {
        variant: 'error',
      });
    }
  };

  // Save Edit Store
  const handleUpdateStore = async () => {
    if (!editingStore) return;
    if (!editStoreName.trim() || !editStoreLocation.trim()) {
      setEditFormError('Please enter both store name and location.');
      return;
    }

    setEditFormError(null);
    try {
      await updateStore({
        storeId: editingStore.id,
        data: {
          name: editStoreName.trim(),
          location: editStoreLocation.trim(),
          is_active: editStoreActive,
        },
      });
      enqueueSnackbar(`Store "${editStoreName}" updated successfully!`, { variant: 'success' });
      setEditModalOpen(false);
      setEditingStore(null);
    } catch (err: unknown) {
      setEditFormError((err as Error).message || 'Failed to update store.');
    }
  };

  // Create New Store
  const handleCreateStore = async () => {
    if (!storeName.trim() || !storeLocation.trim()) {
      setFormError('Please enter both store name and location.');
      return;
    }

    setFormError(null);
    try {
      await createStore({
        name: storeName.trim(),
        location: storeLocation.trim(),
      });
      enqueueSnackbar(`Store "${storeName}" created successfully!`, { variant: 'success' });
      setStoreName('');
      setStoreLocation('');
      setStoreActive(true);
      setModalOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to create store.');
    }
  };

  // Delete Store
  const handleConfirmDelete = async () => {
    if (!storeToDelete) return;
    try {
      await deleteStore(storeToDelete.id);
      enqueueSnackbar(`Store "${storeToDelete.name}" deleted successfully!`, { variant: 'success' });
      setDeleteConfirmOpen(false);
      setStoreToDelete(null);
    } catch (err: unknown) {
      enqueueSnackbar((err as Error).message || 'Failed to delete store', { variant: 'error' });
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
                Store Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Manage store locations, branch assignments, and active ordering status
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
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                '&:hover': { backgroundColor: '#1E293B' },
              }}
            >
              Add Store
            </Button>
          </Box>

          {/* KPI Summary Cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <Card
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: '14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Stores
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {totalStoresCount}
              </Typography>
            </Card>

            <Card
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: '14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, textTransform: 'uppercase' }}>
                Active Stores
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#15803D', mt: 0.5 }}>
                {activeStoresCount}
              </Typography>
            </Card>

            <Card
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: '14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                Inactive Stores
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#64748B', mt: 0.5 }}>
                {inactiveStoresCount}
              </Typography>
            </Card>
          </Stack>

          {/* Filters & Search Toolbar */}
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
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search store by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#64748B', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  '& .MuiInputBase-input': { color: '#0F172A !important' },
                  '& .MuiInputBase-input::placeholder': { color: '#64748B !important', opacity: 1 },
                  '& fieldset': { borderColor: '#CBD5E1' },
                },
              }}
              sx={{ flex: '1 1 260px' }}
            />

            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                sx={{
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: '#0F172A',
                  '& .MuiSelect-select': { color: '#0F172A !important' },
                  '& fieldset': { borderColor: '#CBD5E1' },
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
                <MenuItem value="ALL">All Statuses ({totalStoresCount})</MenuItem>
                <MenuItem value="ACTIVE">Active Only ({activeStoresCount})</MenuItem>
                <MenuItem value="INACTIVE">Inactive Only ({inactiveStoresCount})</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#3B82F6' }} />
            </Box>
          )}

          {isError && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '12px',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #FECACA',
              }}
            >
              {(error as Error)?.message || 'Failed to fetch stores'}
            </Alert>
          )}

          {/* Stores Table */}
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
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', width: 60 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>STORE NAME</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>LOCATION ADDRESS</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', width: 200 }}>STORE STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', width: 140 }}>CREATED AT</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', textAlign: 'right', width: 150 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStores.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                      No stores found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((store, idx) => {
                    const isActive = store.is_active !== false;

                    return (
                      <TableRow key={store.id} hover sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                        <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                backgroundColor: isActive ? '#EFF6FF' : '#F1F5F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isActive ? '#3B82F6' : '#94A3B8',
                              }}
                            >
                              <StorefrontIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                {store.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                                ID: {store.id.slice(0, 12)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{store.location}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Chip
                              icon={
                                isActive ? (
                                  <CheckCircleIcon sx={{ fontSize: '0.9rem !important', color: '#16A34A !important' }} />
                                ) : (
                                  <BlockIcon sx={{ fontSize: '0.9rem !important', color: '#64748B !important' }} />
                                )
                              }
                              label={isActive ? 'Active' : 'Inactive'}
                              size="small"
                              sx={{
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9',
                                color: isActive ? '#15803D' : '#64748B',
                                border: `1px solid ${isActive ? '#BBF7D0' : '#E2E8F0'}`,
                              }}
                            />
                            <Tooltip title={isActive ? 'Click to Deactivate store' : 'Click to Activate store'}>
                              <Button
                                size="small"
                                onClick={() => handleToggleStoreStatus(store)}
                                sx={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  py: 0.3,
                                  px: 1,
                                  borderRadius: '6px',
                                  textTransform: 'none',
                                  color: isActive ? '#DC2626' : '#16A34A',
                                  backgroundColor: isActive ? '#FEF2F2' : '#F0FDF4',
                                  border: `1px solid ${isActive ? '#FECACA' : '#BBF7D0'}`,
                                  '&:hover': {
                                    backgroundColor: isActive ? '#FEE2E2' : '#DCFCE7',
                                  },
                                }}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                          {store.created_at ? new Date(store.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Edit Store">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEdit(store)}
                                sx={{
                                  color: '#3B82F6',
                                  '&:hover': { backgroundColor: '#EFF6FF' },
                                }}
                              >
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Store">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setStoreToDelete(store);
                                  setDeleteConfirmOpen(true);
                                }}
                                sx={{
                                  color: '#EF4444',
                                  '&:hover': { backgroundColor: '#FEF2F2' },
                                }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add Store Modal */}
          <Dialog
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '20px',
                p: 1,
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              },
            }}
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0F172A', fontWeight: 800 }}>
              Add New Store
              <IconButton size="small" onClick={() => setModalOpen(false)} sx={{ color: '#64748B' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
              {formError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    borderRadius: '10px',
                    backgroundColor: '#FEF2F2',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                  }}
                >
                  {formError}
                </Alert>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                    Store Name
                  </Typography>
                  <TextField
                    placeholder="e.g. Westside Cafe & Grill"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        color: '#0F172A',
                        '& .MuiInputBase-input': { color: '#0F172A !important' },
                        '& fieldset': { borderColor: '#CBD5E1' },
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                    Location Address
                  </Typography>
                  <TextField
                    placeholder="e.g. 888 Elm St, Westside"
                    value={storeLocation}
                    onChange={(e) => setStoreLocation(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        color: '#0F172A',
                        '& .MuiInputBase-input': { color: '#0F172A !important' },
                        '& fieldset': { borderColor: '#CBD5E1' },
                      },
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setModalOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateStore}
                disabled={isCreating}
                variant="contained"
                sx={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 2.5,
                  '&:hover': { backgroundColor: '#1E293B' },
                }}
              >
                {isCreating ? <CircularProgress size={20} color="inherit" /> : 'Create Store'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Store Modal */}
          <Dialog
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setEditingStore(null);
            }}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '20px',
                p: 1,
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              },
            }}
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0F172A', fontWeight: 800 }}>
              Edit Store
              <IconButton
                size="small"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingStore(null);
                }}
                sx={{ color: '#64748B' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
              {editFormError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    borderRadius: '10px',
                    backgroundColor: '#FEF2F2',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                  }}
                >
                  {editFormError}
                </Alert>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                    Store Name
                  </Typography>
                  <TextField
                    placeholder="e.g. Westside Cafe & Grill"
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        color: '#0F172A',
                        '& .MuiInputBase-input': { color: '#0F172A !important' },
                        '& fieldset': { borderColor: '#CBD5E1' },
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                    Location Address
                  </Typography>
                  <TextField
                    placeholder="e.g. 888 Elm St, Westside"
                    value={editStoreLocation}
                    onChange={(e) => setEditStoreLocation(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        color: '#0F172A',
                        '& .MuiInputBase-input': { color: '#0F172A !important' },
                        '& fieldset': { borderColor: '#CBD5E1' },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ p: 1.5, backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editStoreActive}
                        onChange={(e) => setEditStoreActive(e.target.checked)}
                        color="success"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          Store Status: {editStoreActive ? 'Active' : 'Inactive'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {editStoreActive
                            ? 'Available for customer orders & POS terminal'
                            : 'Hidden from active ordering'}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingStore(null);
                }}
                sx={{ color: '#64748B', fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStore}
                disabled={isUpdating}
                variant="contained"
                sx={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 2.5,
                  '&:hover': { backgroundColor: '#1E293B' },
                }}
              >
                {isUpdating ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Store Confirmation Dialog */}
          <Dialog
            open={deleteConfirmOpen}
            onClose={() => {
              setDeleteConfirmOpen(false);
              setStoreToDelete(null);
            }}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '20px',
                p: 1,
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
              },
            }}
          >
            <DialogTitle sx={{ color: '#991B1B', fontWeight: 800 }}>
              Delete Store Confirmation
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
                Are you sure you want to permanently delete store <strong>{storeToDelete?.name}</strong>?
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                This action will delete this store and cascade clean all associated menu items, categories, and past orders. This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setStoreToDelete(null);
                }}
                sx={{ color: '#64748B', fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                variant="contained"
                sx={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 2.5,
                  '&:hover': { backgroundColor: '#B91C1C' },
                }}
              >
                {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete Store'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </AdminGuard>
  );
}
