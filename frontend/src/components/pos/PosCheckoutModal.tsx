'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  TextField,
  Chip,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useOfferStore } from '../../store/useOfferStore';
import { useOrderSocket } from '../../context/SocketContext';
import { ApiService } from '../../services/api';
import { PaymentMethod } from '../../types/order';

interface PosCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
}

export function PosCheckoutModal({ open, onClose, storeId }: PosCheckoutModalProps) {
  const {
    items,
    updateQty,
    removeItem,
    clearCart,
    getTotalAmount,
    paymentMethod,
    setPaymentMethod,
  } = useCartStore();

  const { user } = useAuthStore();
  const { trackOrder } = useOrderSocket();
  const { appliedOffer, applyOffer } = useOfferStore();

  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    id: string;
    items: Array<{ name: string; qty: number; price: number }>;
    subtotal: number;
    discountAmount: number;
    tax: number;
    total: number;
    offerCode: string | null;
    paymentMethod: string;
    timestamp: string;
  } | null>(null);

  const subtotal = getTotalAmount();
  const hasMinOrder = !appliedOffer?.minOrderAmount || subtotal >= appliedOffer.minOrderAmount;

  let discountAmount = 0;
  if (appliedOffer && hasMinOrder) {
    if (appliedOffer.discountType === 'PERCENT') {
      discountAmount = Number(((subtotal * appliedOffer.discountValue) / 100).toFixed(2));
    } else {
      discountAmount = Number(Math.min(appliedOffer.discountValue, subtotal).toFixed(2));
    }
  }
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  const tax = Number((discountedSubtotal * 0.05).toFixed(2));
  const grandTotal = Number((discountedSubtotal + tax).toFixed(2));

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Calculate exact proportionate discount ratio so backend stores the accurate deducted bill
      const discountRatio = subtotal > 0 && discountAmount > 0 ? discountedSubtotal / subtotal : 1;

      const orderPayload = {
        store_id: storeId,
        user_id: user?.id || null,
        items: items.map((i) => ({
          item_id: i.item_id,
          name: discountAmount > 0 ? `${i.name} [${appliedOffer?.code} -${appliedOffer?.discountValue}${appliedOffer?.discountType === 'PERCENT' ? '%' : '$'}]` : i.name,
          qty: i.qty,
          price: Number((i.price * discountRatio).toFixed(2)),
        })),
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'CASH' ? ('PENDING' as const) : ('COMPLETED' as const),
      };

      const res = await ApiService.createOrder(orderPayload);
      trackOrder(res.data.id);
      setOrderSuccess({
        id: res.data.id,
        items: items.map((it) => ({ ...it })),
        subtotal,
        discountAmount,
        tax,
        total: grandTotal,
        offerCode: discountAmount > 0 ? (appliedOffer?.code || null) : null,
        paymentMethod,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      clearCart();
      applyOffer(null);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setOrderSuccess(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Checkout & Payment
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Verify items, select payment method, and complete order
          </Typography>
        </Box>
        <IconButton onClick={handleModalClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: '#F1F5F9' }}>
        {orderSuccess ? (
          <Box sx={{ py: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 2.5 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#10B981', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Order Confirmed!
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Accurate Tax Invoice & Receipt
              </Typography>
            </Box>

            {/* Bill Receipt Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                border: '1.5px dashed #CBD5E1',
                backgroundColor: '#F8FAFC',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 1, borderBottom: '1px solid #E2E8F0' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>ORDER ID</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    #{orderSuccess.id.slice(0, 8)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>TIME</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {orderSuccess.timestamp}
                  </Typography>
                </Box>
              </Box>

              {/* Items List */}
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                Ordered Items
              </Typography>
              <Stack spacing={0.8} sx={{ mb: 2 }}>
                {orderSuccess.items.map((it, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                      {it.qty}x {it.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 700 }}>
                      ${(it.qty * it.price).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />

              {/* Price Breakdown */}
              <Stack spacing={0.7}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Subtotal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>${orderSuccess.subtotal.toFixed(2)}</Typography>
                </Box>

                {orderSuccess.discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Offer Applied ({orderSuccess.offerCode})
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      -${orderSuccess.discountAmount.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Tax (5% GST)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>${orderSuccess.tax.toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #CBD5E1' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>Grand Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#FF7A00' }}>
                    ${orderSuccess.total.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ mt: 2, pt: 1.2, borderTop: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Payment Method:</Typography>
                <Chip
                  label={`${orderSuccess.paymentMethod} (PAID)`}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.7rem', backgroundColor: '#DCFCE7', color: '#15803D' }}
                />
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => window.print()}
                sx={{
                  borderColor: '#CBD5E1',
                  color: '#475569',
                  fontWeight: 700,
                  borderRadius: '12px',
                  py: 1.1,
                }}
              >
                Print Receipt
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleModalClose}
                sx={{
                  backgroundColor: '#FF7A00',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: '12px',
                  py: 1.1,
                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                  '&:hover': { backgroundColor: '#E06500' },
                }}
              >
                Start New Order
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
                {errorMessage}
              </Alert>
            )}

            {/* Cart Line Items */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5 }}>
              Order Summary ({items.length} items)
            </Typography>

            {items.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8', py: 3, textAlign: 'center' }}>
                Your cart is currently empty.
              </Typography>
            ) : (
              <Stack spacing={1.5} sx={{ mb: 2.5, maxHeight: 220, overflowY: 'auto', pr: 1 }}>
                {items.map((item) => (
                  <Box
                    key={item.item_id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.2,
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: '#1E293B' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        ${Number(item.price).toFixed(2)} each
                      </Typography>
                    </Box>

                    {/* Stepper */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '20px',
                        px: 0.8,
                        py: 0.2,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => updateQty(item.item_id, -1)}
                        sx={{ p: 0.2, color: '#FF7A00' }}
                      >
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                        {item.qty}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => updateQty(item.item_id, 1)}
                        sx={{ p: 0.2, color: '#FF7A00' }}
                      >
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>

                    {/* Item Total */}
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', minWidth: 65, textAlign: 'right' }}>
                      ${(item.price * item.qty).toFixed(2)}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={() => removeItem(item.item_id)}
                      sx={{ color: '#94A3B8', ml: 0.5, '&:hover': { color: '#EF4444' } }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Table Number or Notes */}
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Table No. / Note (Optional)"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g. Table 4 or Takeaway"
                InputProps={{
                  sx: {
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.85rem',
                  },
                }}
              />
            </Box>

            {/* Payment Method Selector */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
              Select Payment Method
            </Typography>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <Stack spacing={1}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: paymentMethod === 'CASH' ? '2px solid #FF7A00' : '1px solid #E2E8F0',
                    borderRadius: '12px',
                    p: 1.2,
                    cursor: 'pointer',
                    backgroundColor: paymentMethod === 'CASH' ? '#FFF7ED' : '#FFFFFF',
                  }}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PaymentsIcon sx={{ color: '#10B981' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Cash on Delivery
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Pay cash at counter upon pickup
                      </Typography>
                    </Box>
                  </Box>
                  <Radio checked={paymentMethod === 'CASH'} sx={{ color: '#FF7A00', '&.Mui-checked': { color: '#FF7A00' } }} />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: paymentMethod === 'CARD' ? '2px solid #FF7A00' : '1px solid #E2E8F0',
                    borderRadius: '12px',
                    p: 1.2,
                    cursor: 'pointer',
                    backgroundColor: paymentMethod === 'CARD' ? '#FFF7ED' : '#FFFFFF',
                  }}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CreditCardIcon sx={{ color: '#3B82F6' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Credit / Debit Card
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Simulated instant card payment
                      </Typography>
                    </Box>
                  </Box>
                  <Radio checked={paymentMethod === 'CARD'} sx={{ color: '#FF7A00', '&.Mui-checked': { color: '#FF7A00' } }} />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: paymentMethod === 'UPI' ? '2px solid #FF7A00' : '1px solid #E2E8F0',
                    borderRadius: '12px',
                    p: 1.2,
                    cursor: 'pointer',
                    backgroundColor: paymentMethod === 'UPI' ? '#FFF7ED' : '#FFFFFF',
                  }}
                  onClick={() => setPaymentMethod('UPI')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <QrCode2Icon sx={{ color: '#8B5CF6' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        UPI / QR Code
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Instant mobile UPI transfer
                      </Typography>
                    </Box>
                  </Box>
                  <Radio checked={paymentMethod === 'UPI'} sx={{ color: '#FF7A00', '&.Mui-checked': { color: '#FF7A00' } }} />
                </Box>
              </Stack>
            </RadioGroup>

            <Divider sx={{ my: 2 }} />

            {/* Applied Promotion / Deal Badge */}
            {appliedOffer ? (
              hasMinOrder ? (
                <Box
                  sx={{
                    mb: 1.5,
                    p: 1.2,
                    px: 1.8,
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ConfirmationNumberIcon sx={{ color: '#059669', fontSize: 18 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#065F46' }}>
                        {appliedOffer.code} ({appliedOffer.discountType === 'PERCENT' ? `${appliedOffer.discountValue}% Off` : `$${appliedOffer.discountValue} Flat`})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                        Discount applied: -${discountAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => applyOffer(null)}
                    sx={{ color: '#DC2626', fontSize: '0.72rem', fontWeight: 700, p: 0, minWidth: 'auto' }}
                  >
                    Remove
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    mb: 1.5,
                    p: 1.2,
                    px: 1.8,
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#B45309' }}>
                      {appliedOffer.code} (Min Order ${appliedOffer.minOrderAmount.toFixed(2)})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#D97706', display: 'block' }}>
                      Add ${(appliedOffer.minOrderAmount - subtotal).toFixed(2)} more to qualify for discount
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => applyOffer(null)}
                    sx={{ color: '#DC2626', fontSize: '0.72rem', fontWeight: 700, p: 0, minWidth: 'auto' }}
                  >
                    Remove
                  </Button>
                </Box>
              )
            ) : null}

            {/* Calculations Breakdown */}
            <Stack spacing={0.8}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Subtotal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${subtotal.toFixed(2)}
                </Typography>
              </Box>

              {discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600 }}>
                    Promotional Discount ({appliedOffer?.code})
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700 }}>
                    -${discountAmount.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Tax (5%)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${tax.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Total Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FF7A00' }}>
                  ${grandTotal.toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>

      {!orderSuccess && (
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleModalClose} disabled={isSubmitting} sx={{ color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handlePlaceOrder}
            disabled={items.length === 0 || isSubmitting}
            variant="contained"
            sx={{
              backgroundColor: '#FF7A00',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: '12px',
              px: 3.5,
              py: 1.2,
              boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
              '&:hover': { backgroundColor: '#E06500' },
            }}
          >
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : `Confirm & Pay $${grandTotal.toFixed(2)}`}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
