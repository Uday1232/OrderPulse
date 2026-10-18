'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FastfoodIcon from '@mui/icons-material/Fastfood';

import { useOrderSocket } from '../../context/SocketContext';
import { ApiService } from '../../services/api';
import { AVAILABLE_STORES, POPULAR_MENU_PRESETS } from '../../types/order';

interface OrderLineItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const { currentStoreId, setCurrentStoreId } = useOrderSocket();

  const [selectedStore, setSelectedStore] = useState<string>(currentStoreId);
  const [items, setItems] = useState<OrderLineItem[]>([
    { id: '1', name: 'Margherita Pizza', quantity: 1, unit_price: 14.99 },
    { id: '2', name: 'Espresso', quantity: 2, unit_price: 3.5 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        quantity: 1,
        unit_price: 10.0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (
    id: string,
    field: 'name' | 'quantity' | 'unit_price',
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  const handleAddPreset = (preset: { name: string; unit_price: number }) => {
    const existingIndex = items.findIndex((i) => i.name.toLowerCase() === preset.name.toLowerCase());
    if (existingIndex !== -1) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: preset.name,
          quantity: 1,
          unit_price: preset.unit_price,
        },
      ]);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const lineSubtotal = Math.max(0, item.quantity) * Math.max(0, item.unit_price);
      return sum + lineSubtotal;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Frontend validation
    if (!selectedStore) {
      setErrorMessage('Please select a restaurant store');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('At least one item is required to place an order');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i]!;
      if (!it.name.trim()) {
        setErrorMessage(`Item #${i + 1} must have a name`);
        return;
      }
      if (it.quantity <= 0) {
        setErrorMessage(`Item "${it.name}" must have a quantity of at least 1`);
        return;
      }
      if (it.unit_price <= 0) {
        setErrorMessage(`Item "${it.name}" must have a unit price greater than 0`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        store_id: selectedStore,
        items: items.map((it) => ({
          name: it.name.trim(),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      };

      const result = await ApiService.createOrder(payload);

      // Keep socket synced to the store where order was created
      setCurrentStoreId(selectedStore);

      setSuccessMessage(`Order #${result.data.id.slice(0, 8)} placed successfully! Redirecting...`);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const grandTotal = calculateTotal();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button and Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackIcon />}
          sx={{ color: '#9CA3AF', mb: 2 }}
        >
          Back to Orders List
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#F9FAFB' }}>
          Create New Order
        </Typography>
        <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>
          Assemble items, customize quantities, and stream real-time updates to the kitchen display
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ mb: 3 }}
        >
          {successMessage}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left Column: Form Details & Items */}
          <Grid item xs={12} md={8}>
            {/* Store Selection Card */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorefrontIcon sx={{ color: '#F59E0B' }} />
                1. Select Store Location
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="store-select-label">Store</InputLabel>
                <Select
                  labelId="store-select-label"
                  label="Store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                >
                  {AVAILABLE_STORES.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {s.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                          {s.location}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Card>

            {/* Quick Menu Presets */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FastfoodIcon sx={{ color: '#F59E0B' }} />
                Quick-Add Popular Items
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mb: 2 }}>
                Click any dish to add or increment quantity
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {POPULAR_MENU_PRESETS.map((preset) => (
                  <Chip
                    key={preset.name}
                    label={`${preset.name} ($${preset.unit_price.toFixed(2)})`}
                    onClick={() => handleAddPreset(preset)}
                    icon={<AddIcon sx={{ fontSize: '1rem !important' }} />}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        borderColor: 'rgba(245, 158, 11, 0.4)',
                        color: '#FBBF24',
                      },
                    }}
                  />
                ))}
              </Box>
            </Card>

            {/* Order Items List */}
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">2. Order Items</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  Add Custom Item
                </Button>
              </Box>

              <Stack spacing={2}>
                {items.map((item, index) => {
                  const lineSubtotal = item.quantity * item.unit_price;

                  return (
                    <Paper
                      key={item.id}
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 2,
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                          <TextField
                            fullWidth
                            size="small"
                            label={`Item #${index + 1} Name`}
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={5} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Qty"
                            type="number"
                            inputProps={{ min: 1, step: 1 }}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 1)
                            }
                            required
                          />
                        </Grid>
                        <Grid item xs={5} sm={2.5}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Price ($)"
                            type="number"
                            inputProps={{ min: 0.1, step: 0.01 }}
                            value={item.unit_price}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)
                            }
                            required
                          />
                        </Grid>
                        <Grid item xs={2} sm={1.5} sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#F9FAFB' }}>
                            ${lineSubtotal.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={1} sx={{ textAlign: 'right' }}>
                          <IconButton
                            size="small"
                            disabled={items.length <= 1}
                            onClick={() => handleRemoveItem(item.id)}
                            sx={{ color: '#EF4444', opacity: items.length <= 1 ? 0.3 : 1 }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            </Card>
          </Grid>

          {/* Right Column: Order Summary & Place Order Button */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, position: 'sticky', top: 90 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Order Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  Total Items
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {items.reduce((sum, it) => sum + Number(it.quantity || 0), 0)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  Item Rows
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {items.length}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  Store
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                  {AVAILABLE_STORES.find((s) => s.id === selectedStore)?.name || selectedStore}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Grand Total
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981' }}>
                  ${grandTotal.toFixed(2)}
                </Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isSubmitting || grandTotal <= 0}
                startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                sx={{
                  py: 1.5,
                  fontWeight: 800,
                  fontSize: '1rem',
                }}
              >
                {isSubmitting ? 'Placing Order...' : 'Submit Order'}
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
