'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PercentIcon from '@mui/icons-material/Percent';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { AdminSidebar } from '../../../components/admin/AdminSidebar';
import { AdminGuard } from '../../../components/auth/AdminGuard';
import { useOfferStore, DealOffer } from '../../../store/useOfferStore';

export default function AdminOffersPage() {
  const { offers, addOffer, updateOffer, deleteOffer, toggleActive } = useOfferStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [category, setCategory] = useState('All Items');
  const [badgeText, setBadgeText] = useState('SPECIAL OFFER');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const activeCount = offers.filter((o) => o.isActive).length;

  const handleOpenCreate = () => {
    setEditingId(null);
    setCode('');
    setTitle('');
    setDescription('');
    setDiscountType('PERCENT');
    setDiscountValue(15);
    setMinOrderAmount(10);
    setCategory('All Items');
    setBadgeText('🔥 NEW DEAL');
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (offer: DealOffer) => {
    setEditingId(offer.id);
    setCode(offer.code);
    setTitle(offer.title);
    setDescription(offer.description);
    setDiscountType(offer.discountType);
    setDiscountValue(offer.discountValue);
    setMinOrderAmount(offer.minOrderAmount);
    setCategory(offer.category || 'All Items');
    setBadgeText(offer.badgeText || '');
    setIsActive(offer.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!code.trim() || !title.trim()) {
      setFormError('Please enter both a promo code and an offer title');
      return;
    }
    if (discountValue <= 0) {
      setFormError('Discount value must be greater than zero');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      category,
      badgeText: badgeText.trim(),
      isActive,
    };

    if (editingId) {
      updateOffer(editingId, payload);
    } else {
      addOffer(payload);
    }

    setModalOpen(false);
  };

  return (
    <AdminGuard>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 4 }, overflowY: 'auto' }}>
          {/* Top Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3.5,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' } }}>
                Offers & Deals Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Configure promotional discount coupons that appear directly inside the POS terminal and checkout
              </Typography>
            </Box>

            <Button
              onClick={handleOpenCreate}
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: '12px',
                backgroundColor: '#FF7A00',
                color: '#FFFFFF',
                fontWeight: 700,
                px: 2.8,
                py: 1.1,
                boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                '&:hover': { backgroundColor: '#E06500' },
              }}
            >
              Create New Offer
            </Button>
          </Box>

          {/* Quick Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2.8, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Offers
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 0.8 }}>
                  {offers.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Configured across stores
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2.8, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, textTransform: 'uppercase' }}>
                  Live Campaigns
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#15803D', my: 0.8 }}>
                  {activeCount} Active
                </Typography>
                <Typography variant="caption" sx={{ color: '#16A34A' }}>
                  Currently redeemable in POS
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2.8, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Inactive / Drafts
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#64748B', my: 0.8 }}>
                  {offers.length - activeCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Paused promotions
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Offers Table */}
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: 'none',
              overflowX: 'auto',
            }}
          >
            <Table sx={{ minWidth: 600 }}>
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>PROMO CODE</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>TITLE & DESCRIPTION</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>DISCOUNT</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>MIN ORDER</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>
                      <ConfirmationNumberIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1 }} />
                      <Typography variant="body2">No promotional offers created yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  offers.map((offer) => (
                    <TableRow key={offer.id} sx={{ backgroundColor: '#FFFFFF', '&:hover': { backgroundColor: '#F8FAFC' } }}>
                      <TableCell>
                        <Chip
                          label={offer.code}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            backgroundColor: '#FFEDD5',
                            color: '#EA580C',
                            borderRadius: '6px',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {offer.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            {offer.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            offer.discountType === 'PERCENT'
                              ? `${offer.discountValue}% OFF`
                              : `₹${offer.discountValue.toFixed(2)} FLAT`
                          }
                          size="small"
                          sx={{
                            fontWeight: 700,
                            borderRadius: '6px',
                            backgroundColor: offer.discountType === 'PERCENT' ? '#DBEAFE' : '#DCFCE7',
                            color: offer.discountType === 'PERCENT' ? '#1D4ED8' : '#15803D',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          ₹{offer.minOrderAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Switch
                            checked={offer.isActive}
                            onChange={() => toggleActive(offer.id)}
                            color="success"
                            size="small"
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: offer.isActive ? '#15803D' : '#64748B',
                            }}
                          >
                            {offer.isActive ? 'Active' : 'Paused'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit Offer">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(offer)}
                              sx={{
                                color: '#3B82F6',
                                '&:hover': { backgroundColor: '#EFF6FF' },
                              }}
                            >
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Offer">
                            <IconButton
                              size="small"
                              onClick={() => deleteOffer(offer.id)}
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
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
        <DialogTitle sx={{ fontWeight: 800, p: 3, pb: 1, color: '#0F172A' }}>
          {editingId ? 'Edit Promotional Offer' : 'Create New Offer Deal'}
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 2 }}>
          {formError && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #FECACA',
              }}
            >
              {formError}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Promo Code"
                  placeholder="e.g. FLASH25"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  helperText="Cashier or customer enters this code"
                  size="small"
                  required
                  InputLabelProps={{ sx: { color: '#475569', '&.Mui-focused': { color: '#FF7A00' } } }}
                  FormHelperTextProps={{ sx: { color: '#64748B' } }}
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
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Badge Tag (Optional)"
                  placeholder="e.g. 🔥 HOT DEAL"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  size="small"
                  InputLabelProps={{ sx: { color: '#475569', '&.Mui-focused': { color: '#FF7A00' } } }}
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
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Offer Title"
              placeholder="e.g. 25% Off Weekend Combos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="small"
              required
              InputLabelProps={{ sx: { color: '#475569', '&.Mui-focused': { color: '#FF7A00' } } }}
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

            <TextField
              fullWidth
              label="Description"
              placeholder="e.g. Valid on all artisanal pizzas and beverages over $20"
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size="small"
              InputLabelProps={{ sx: { color: '#475569', '&.Mui-focused': { color: '#FF7A00' } } }}
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

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#475569', '&.Mui-focused': { color: '#FF7A00' } }}>Discount Type</InputLabel>
                  <Select
                    value={discountType}
                    label="Discount Type"
                    onChange={(e) => setDiscountType(e.target.value as 'PERCENT' | 'FLAT')}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
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
                            '&:hover': { backgroundColor: '#F1F5F9' },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="PERCENT">Percentage (% Off)</MenuItem>
                    <MenuItem value="FLAT">Flat Cash (₹ Off)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={discountType === 'PERCENT' ? 'Discount %' : 'Discount Amount (₹)'}
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  size="small"
                  required
                  InputLabelProps={{ sx: { color: '#475569', '&.Mui-focused': { color: '#FF7A00' } } }}
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
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Minimum Order (₹)"
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                  size="small"
                  helperText="0 for no minimum"
                  InputLabelProps={{ sx: { color: '#475569', '&.Mui-focused': { color: '#FF7A00' } } }}
                  FormHelperTextProps={{ sx: { color: '#64748B' } }}
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
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#475569', '&.Mui-focused': { color: '#FF7A00' } }}>Applicable Category</InputLabel>
                  <Select
                    value={category}
                    label="Applicable Category"
                    onChange={(e) => setCategory(e.target.value)}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
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
                            '&:hover': { backgroundColor: '#F1F5F9' },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="All Items">All Menu Items</MenuItem>
                    <MenuItem value="Sandwich">Sandwiches</MenuItem>
                    <MenuItem value="Pizza">Pizzas</MenuItem>
                    <MenuItem value="Burger">Burgers</MenuItem>
                    <MenuItem value="Beverages">Beverages</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* High Contrast Live Switch Container */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Publish Offer Live Immediately
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  If active, offer will appear inside POS terminal and checkout
                </Typography>
              </Box>
              <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              backgroundColor: '#FF7A00',
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: '10px',
              px: 3,
              '&:hover': { backgroundColor: '#E06500' },
            }}
          >
            {editingId ? 'Save Changes' : 'Create Offer'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminGuard>
  );
}
