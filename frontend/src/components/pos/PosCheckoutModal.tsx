'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Checkbox,
  CircularProgress,
  Alert,
  TextField,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useOfferStore } from '../../store/useOfferStore';
import { useOrderSocket } from '../../context/SocketContext';
import { useStores } from '../../hooks/useStores';
import { ApiService } from '../../services/api';
import { PaymentMethod, Order } from '../../types/order';

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

  const { user, updateUser } = useAuthStore();
  const { trackOrder } = useOrderSocket();
  const { appliedOffer, applyOffer } = useOfferStore();
  const { stores } = useStores();
  const currentStore = stores.find((s) => s.id === storeId) || stores[0];

  const [tableNumber, setTableNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  const [isAddressAutoFilled, setIsAddressAutoFilled] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

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
    deliveryAddress: string;
    timestamp: string;
  } | null>(null);

  // Auto-fill address from profile or localStorage when modal opens
  useEffect(() => {
    if (open) {
      setAddressError(null);
      let savedAddress = user?.address || '';
      if (!savedAddress && typeof window !== 'undefined') {
        savedAddress = localStorage.getItem('user_delivery_address') || '';
      }
      if (!savedAddress && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('tmbill_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.address) savedAddress = parsed.address;
          }
        } catch {}
      }

      if (savedAddress && savedAddress.trim().length > 0) {
        setDeliveryAddress(savedAddress);
        setIsAddressAutoFilled(true);
      } else {
        setDeliveryAddress('');
        setIsAddressAutoFilled(false);
      }
    }
  }, [open, user]);

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
    if (!user) {
      setErrorMessage('Authentication required: Please sign in or create an account to place your order.');
      return;
    }
    if (items.length === 0) return;

    const trimmedAddress = deliveryAddress.trim();
    if (!trimmedAddress) {
      setAddressError('Delivery address is COMPULSORY to place an order. Please enter your address.');
      setErrorMessage('Delivery address is compulsory. Please enter your address above.');
      const el = document.getElementById('checkout-delivery-address-input');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }
    setAddressError(null);
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
          name: discountAmount > 0 ? `${i.name} [${appliedOffer?.code} -${appliedOffer?.discountValue}${appliedOffer?.discountType === 'PERCENT' ? '%' : '₹'}]` : i.name,
          qty: i.qty,
          price: Number((i.price * discountRatio).toFixed(2)),
        })),
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'CASH' ? ('PENDING' as const) : ('COMPLETED' as const),
        delivery_address: trimmedAddress,
        address: trimmedAddress,
        save_address: saveAddressToProfile,
      };

      const res = await ApiService.createOrder(orderPayload);
      trackOrder(res.data.id);

      // Save address to client profile state and localStorage
      if (saveAddressToProfile || !user.address) {
        updateUser({ address: trimmedAddress });
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_delivery_address', trimmedAddress);
        }
      }

      // Save to local storage for instant zero-lag display in My Orders
      try {
        const existing: Order[] = JSON.parse(localStorage.getItem('sp_my_orders') || '[]');
        const updated = [res.data, ...existing.filter((o) => o.id !== res.data.id)];
        localStorage.setItem('sp_my_orders', JSON.stringify(updated));
      } catch {}

      setOrderSuccess({
        id: res.data.id,
        items: items.map((it) => ({ ...it })),
        subtotal,
        discountAmount,
        tax,
        total: grandTotal,
        offerCode: discountAmount > 0 ? (appliedOffer?.code || null) : null,
        paymentMethod,
        deliveryAddress: trimmedAddress,
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

  const handlePrintReceipt = () => {
    if (!orderSuccess) return;
    if (typeof window === 'undefined') return;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    const itemsRows = orderSuccess.items
      .map(
        (it) => `
        <tr>
          <td style="padding: 7px 0; font-size: 13px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${it.qty}x ${it.name}</td>
          <td style="padding: 7px 0; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">₹${(it.qty * it.price).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const discountHtml =
      orderSuccess.discountAmount > 0
        ? `
        <tr style="color: #16a34a;">
          <td style="padding: 5px 0; font-size: 13px; font-weight: 600;">Offer Applied (${orderSuccess.offerCode || 'DISCOUNT'})</td>
          <td style="padding: 5px 0; text-align: right; font-size: 13px; font-weight: 700;">-₹${orderSuccess.discountAmount.toFixed(2)}</td>
        </tr>
      `
        : '';

    const addressHtml = orderSuccess.deliveryAddress
      ? `
        <div style="margin-top: 14px; padding: 10px 12px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">Delivery Address</div>
          <div style="font-size: 12px; font-weight: 600; color: #1e293b;">${orderSuccess.deliveryAddress}</div>
        </div>
      `
      : '';

    const customerName = user?.name?.trim() ? user.name : 'Valued Customer';
    const storeName = currentStore?.name || 'StorePulse Food Hub';
    const storeLocation = currentStore?.location || 'Savedi, Ahilyanagar, Maharashtra';

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt_${orderSuccess.id.slice(0, 8)}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: auto;
              margin: 8mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 12px;
            }
            .receipt-box {
              max-width: 420px;
              margin: 0 auto;
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 22px;
              box-sizing: border-box;
            }
            .store-header {
              text-align: center;
              border-bottom: 2px dashed #cbd5e1;
              padding-bottom: 14px;
              margin-bottom: 14px;
            }
            .store-brand {
              font-size: 22px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.5px;
            }
            .brand-accent {
              color: #ff7a00;
            }
            .store-outlet {
              font-size: 14px;
              font-weight: 700;
              color: #334155;
              margin-top: 3px;
            }
            .store-location {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            .doc-title {
              display: inline-block;
              margin-top: 8px;
              padding: 3px 10px;
              background: #f1f5f9;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.06em;
              color: #475569;
              text-transform: uppercase;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              padding-bottom: 12px;
              margin-bottom: 12px;
              border-bottom: 1px solid #f1f5f9;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            .meta-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #94a3b8;
            }
            .meta-value {
              font-size: 12px;
              font-weight: 700;
              color: #1e293b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .section-label {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
              margin-bottom: 6px;
            }
            .totals-table {
              margin-top: 10px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
            }
            .grand-total-row td {
              padding: 10px 0 4px 0;
              border-top: 2px solid #0f172a;
              font-size: 15px;
              font-weight: 900;
              color: #0f172a;
            }
            .grand-total-price {
              color: #ff7a00;
              font-size: 17px;
            }
            .payment-row {
              margin-top: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 7px 10px;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 700;
              color: #166534;
            }
            .receipt-footer {
              margin-top: 18px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px dashed #e2e8f0;
              padding-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="store-header">
              <div class="store-brand">Store<span class="brand-accent">Pulse</span></div>
              <div class="store-outlet">${storeName}</div>
              <div class="store-location">📍 ${storeLocation}</div>
              <div class="doc-title">Tax Invoice & Cash Memo</div>
            </div>

            <div class="meta-row">
              <div class="meta-item">
                <span class="meta-label">Order ID</span>
                <span class="meta-value">#${orderSuccess.id.slice(0, 8)}</span>
                <span class="meta-label" style="margin-top: 4px;">Customer</span>
                <span class="meta-value">${customerName}</span>
              </div>
              <div class="meta-item" style="text-align: right;">
                <span class="meta-label">Time</span>
                <span class="meta-value">${orderSuccess.timestamp}</span>
                <span class="meta-label" style="margin-top: 4px;">Order Type</span>
                <span class="meta-value">${orderSuccess.deliveryAddress ? 'Home Delivery' : 'Dine-In / Counter'}</span>
              </div>
            </div>

            <div class="section-label">Ordered Items</div>
            <table>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <table class="totals-table">
              <tbody>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Subtotal</td>
                  <td style="padding: 4px 0; text-align: right; font-size: 13px; font-weight: 600;">₹${orderSuccess.subtotal.toFixed(2)}</td>
                </tr>
                ${discountHtml}
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Tax (5% GST)</td>
                  <td style="padding: 4px 0; text-align: right; font-size: 13px; font-weight: 600;">₹${orderSuccess.tax.toFixed(2)}</td>
                </tr>
                <tr class="grand-total-row">
                  <td>Grand Total</td>
                  <td class="grand-total-price" style="text-align: right;">₹${orderSuccess.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="payment-row">
              <span>Payment Method</span>
              <span>${orderSuccess.paymentMethod} (PAID)</span>
            </div>

            ${addressHtml}

            <div class="receipt-footer">
              <div style="font-weight: 700; color: #475569; margin-bottom: 2px;">Thank you for dining with StorePulse!</div>
              <div>FSSAI Lic. & GST Compliant Invoice • Please Visit Again</div>
            </div>
          </div>
        </body>
      </html>
    `;

    frameDoc.open();
    frameDoc.write(receiptHtml);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch {
        window.print();
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(printFrame);
          } catch {}
        }, 1500);
      }
    }, 250);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '24px',
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          p: isMobile ? 0.5 : 1,
        },
      }}
    >
      <DialogTitle
        className="no-print"
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

            {/* Print Isolation Styles */}
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                .no-print,
                .no-print *,
                .MuiDialogTitle-root,
                .MuiDialogTitle-root *,
                .MuiBackdrop-root,
                button {
                  display: none !important;
                  visibility: hidden !important;
                }
                #printable-receipt-card,
                #printable-receipt-card * {
                  visibility: visible !important;
                }
                #printable-receipt-card {
                  position: fixed !important;
                  left: 50% !important;
                  top: 20px !important;
                  transform: translateX(-50%) !important;
                  width: 100% !important;
                  max-width: 440px !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: 1px solid #cbd5e1 !important;
                  background: #ffffff !important;
                }
              }
            `}</style>

            {/* Bill Receipt Card */}
            <Paper
              id="printable-receipt-card"
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
                      ₹{(it.qty * it.price).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />

              {/* Price Breakdown */}
              <Stack spacing={0.7}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Subtotal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{orderSuccess.subtotal.toFixed(2)}</Typography>
                </Box>

                {orderSuccess.discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Offer Applied ({orderSuccess.offerCode})
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      -₹{orderSuccess.discountAmount.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Tax (5% GST)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{orderSuccess.tax.toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #CBD5E1' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>Grand Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#FF7A00' }}>
                    ₹{orderSuccess.total.toFixed(2)}
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

              {orderSuccess.deliveryAddress && (
                <Box sx={{ mt: 1.5, pt: 1.2, borderTop: '1px dashed #CBD5E1' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#64748B', mb: 0.3 }}>
                    <LocationOnIcon sx={{ fontSize: 15, color: '#FF7A00' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Delivery Address
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.82rem', pl: 2.5 }}>
                    {orderSuccess.deliveryAddress}
                  </Typography>
                </Box>
              )}
            </Paper>

            <Box className="no-print" sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handlePrintReceipt}
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
            {!user && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: '16px',
                  backgroundColor: '#FFFBEB',
                  border: '2px solid #FCD34D',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      backgroundColor: '#FEF3C7',
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <LockOutlinedIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#92400E', mb: 0.5 }}>
                      Sign In or Register Required to Place Order
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#B45309', mb: 2, fontSize: '0.85rem', lineHeight: 1.5 }}>
                      You must be signed in to place an order. Sign in to your account or create a new one to enable live kitchen status tracking and digital receipts.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        component={Link}
                        href="/login"
                        variant="contained"
                        size="small"
                        sx={{
                          backgroundColor: '#D97706',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          borderRadius: '10px',
                          px: 2.5,
                          py: 0.8,
                          textTransform: 'none',
                          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                          '&:hover': { backgroundColor: '#B45309' },
                        }}
                      >
                        Sign In Now
                      </Button>
                      <Button
                        component={Link}
                        href="/login?mode=register"
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: '#D97706',
                          color: '#B45309',
                          fontWeight: 700,
                          borderRadius: '10px',
                          px: 2.5,
                          py: 0.8,
                          textTransform: 'none',
                          backgroundColor: '#FFFFFF',
                          '&:hover': { backgroundColor: '#FEF3C7', borderColor: '#B45309' },
                        }}
                      >
                        Create New Account
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              </Paper>
            )}

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
                        ₹{Number(item.price).toFixed(2)} each
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
                      ₹{(item.price * item.qty).toFixed(2)}
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

            {/* Delivery Address Section (Required) */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <LocationOnIcon sx={{ color: '#FF7A00', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                    Delivery Address <span style={{ color: '#EF4444', fontWeight: 900 }}>* (Compulsory)</span>
                  </Typography>
                </Box>
                {isAddressAutoFilled && deliveryAddress && (
                  <Chip
                    icon={<CheckCircleOutlineIcon sx={{ fontSize: '13px !important', color: '#16A34A !important' }} />}
                    label="Auto-filled from profile"
                    size="small"
                    sx={{
                      backgroundColor: '#ECFDF5',
                      color: '#15803D',
                      border: '1px solid #A7F3D0',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      height: 22,
                    }}
                  />
                )}
              </Box>

              <TextField
                id="checkout-delivery-address-input"
                multiline
                rows={2}
                fullWidth
                placeholder="Enter complete delivery address (Flat / House No, Street, Landmark, City, Pincode)..."
                value={deliveryAddress}
                onChange={(e) => {
                  setDeliveryAddress(e.target.value);
                  if (addressError) setAddressError(null);
                }}
                error={Boolean(addressError)}
                helperText={addressError}
                sx={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A !important',
                    '& fieldset': {
                      borderColor: Boolean(addressError) ? '#EF4444' : '#CBD5E1',
                      borderWidth: Boolean(addressError) ? '2px' : '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: Boolean(addressError) ? '#DC2626' : '#94A3B8',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: Boolean(addressError) ? '#EF4444' : '#FF7A00',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#0F172A !important',
                    WebkitTextFillColor: '#0F172A !important',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    lineHeight: 1.5,
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#94A3B8 !important',
                    WebkitTextFillColor: '#94A3B8 !important',
                    opacity: 1,
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#EF4444 !important',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    mt: 0.8,
                  },
                }}
              />

              {user && (
                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={saveAddressToProfile}
                        onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                        size="small"
                        sx={{
                          color: '#CBD5E1',
                          '&.Mui-checked': { color: '#FF7A00' },
                          p: 0.5,
                        }}
                      />
                    }
                    label={
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                        Save this address to my profile for future orders
                      </Typography>
                    }
                    sx={{ ml: 0 }}
                  />
                </Box>
              )}
            </Box>

            {/* Table Number or Notes */}
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Table No. / Note (Optional)"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g. Table 4 or Takeaway"
                sx={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A !important',
                    '& fieldset': { borderColor: '#CBD5E1' },
                    '&:hover fieldset': { borderColor: '#94A3B8' },
                    '&.Mui-focused fieldset': { borderColor: '#FF7A00' },
                  },
                  '& .MuiInputBase-input': {
                    color: '#0F172A !important',
                    WebkitTextFillColor: '#0F172A !important',
                    fontSize: '0.85rem',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#64748B',
                    '&.Mui-focused': { color: '#FF7A00' },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#94A3B8 !important',
                    WebkitTextFillColor: '#94A3B8 !important',
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
                        {appliedOffer.code} ({appliedOffer.discountType === 'PERCENT' ? `${appliedOffer.discountValue}% Off` : `₹${appliedOffer.discountValue} Flat`})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                        Discount applied: -₹{discountAmount.toFixed(2)}
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
                      {appliedOffer.code} (Min Order ₹{appliedOffer.minOrderAmount.toFixed(2)})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#D97706', display: 'block' }}>
                      Add ₹{(appliedOffer.minOrderAmount - subtotal).toFixed(2)} more to qualify for discount
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
                  ₹{subtotal.toFixed(2)}
                </Typography>
              </Box>

              {discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600 }}>
                    Promotional Discount ({appliedOffer?.code})
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700 }}>
                    -₹{discountAmount.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Tax (5%)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ₹{tax.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Total Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FF7A00' }}>
                  ₹{grandTotal.toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>

      {!orderSuccess && (
        <DialogActions sx={{ p: 2.5, px: 3, borderTop: '1px solid #F1F5F9' }}>
          <Button onClick={handleModalClose} disabled={isSubmitting} sx={{ color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          {!user ? (
            <Stack direction="row" spacing={1.5}>
              <Button
                component={Link}
                href="/login"
                variant="contained"
                sx={{
                  backgroundColor: '#FF7A00',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.1,
                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                  '&:hover': { backgroundColor: '#E06500' },
                }}
              >
                Sign In to Place Order
              </Button>
              <Button
                component={Link}
                href="/login?mode=register"
                variant="outlined"
                sx={{
                  borderColor: '#CBD5E1',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  borderRadius: '12px',
                  px: 2.5,
                  py: 1.1,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#F8FAFC', borderColor: '#94A3B8' },
                }}
              >
                Create New Account
              </Button>
            </Stack>
          ) : (
            <Button
              onClick={handlePlaceOrder}
              disabled={items.length === 0 || isSubmitting}
              variant="contained"
              sx={{
                backgroundColor: !deliveryAddress.trim() ? '#EA580C' : '#FF7A00',
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
              {isSubmitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : !deliveryAddress.trim() ? (
                `Enter Address to Pay ₹${grandTotal.toFixed(2)}`
              ) : (
                `Confirm & Pay ₹${grandTotal.toFixed(2)}`
              )}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
