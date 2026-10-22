'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmailIcon from '@mui/icons-material/Email';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile, OrderStatus } from '../../types/order';

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export function UserProfileDialog({ open, onClose }: UserProfileDialogProps) {
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delivery Address Edit State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (open && user) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsEditingAddress(false);

      const initialAddress = user.address || (typeof window !== 'undefined' ? localStorage.getItem('user_delivery_address') : '') || '';
      setAddressInput(initialAddress);

      // Pre-populate with session user immediately so modal opens instantly without glitch
      setProfile((prev) => prev || {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: initialAddress,
        created_at: user.created_at || new Date().toISOString(),
        ordersCount: 0,
      });

      ApiService.getUserProfile()
        .then((res) => {
          if (res && res.data) {
            setProfile(res.data);
            if (res.data.address) {
              setAddressInput(res.data.address);
              if (typeof window !== 'undefined') {
                localStorage.setItem('user_delivery_address', res.data.address);
              }
            }
          }
        })
        .catch(() => {
          // Graceful fallback to session details without scary technical 404 alert
          if (user) {
            setProfile((prev) => prev || {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              address: initialAddress,
              created_at: user.created_at || new Date().toISOString(),
              ordersCount: 0,
            });
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, user]);

  const handleSaveAddress = async () => {
    const trimmed = addressInput.trim();
    if (!trimmed) return;

    setIsSavingAddress(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await ApiService.updateProfile({ address: trimmed });
      const updatedAddr = res.data?.address || trimmed;

      setProfile((prev) => (prev ? { ...prev, address: updatedAddr } : null));
      updateUser({ address: updatedAddr });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_delivery_address', updatedAddr);
      }
      setIsEditingAddress(false);
      setSuccessMsg('Delivery address saved to your profile!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to update address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  if (!user) return null;

  const displayName = profile?.name?.trim() || user.name?.trim() || user.role || 'User';
  const displayRole = profile?.role || user.role;
  const initial = displayName.charAt(0).toUpperCase() || 'U';

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PREPARED':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      default:
        return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      {/* Dialog Header with Gradient Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: '#FFFFFF',
          px: 3,
          py: 2.5,
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            User Profile
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* User Identity Hero */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Avatar
            sx={{
              width: 58,
              height: 58,
              backgroundColor: '#FF7A00',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.5rem',
              boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
                {displayName}
              </Typography>
              <Chip
                label={displayRole}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: displayRole === 'SUPERADMIN' ? '#7C3AED' : displayRole === 'ADMIN' ? '#2563EB' : '#059669',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.8rem', mt: 0.3 }} noWrap>
              {profile?.email || user.email}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Dialog Body Content */}
      <DialogContent sx={{ p: 3, backgroundColor: '#F8FAFC' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#FF7A00' }} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {errorMsg && (
              <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '0.8rem' }}>
                {errorMsg}
              </Alert>
            )}

            {successMsg && (
              <Alert severity="success" sx={{ borderRadius: '12px', fontSize: '0.8rem' }}>
                {successMsg}
              </Alert>
            )}

            {/* Quick Metrics Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#FF7A00', mb: 0.5 }}>
                  <ShoppingBagIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                    Orders Placed
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  {profile?.ordersCount ?? 0}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#2563EB', mb: 0.5 }}>
                  <ShieldIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                    Account Role
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>
                  {displayRole}
                </Typography>
              </Box>
            </Box>

            {/* Account Details Panel */}
            <Box
              sx={{
                p: 2,
                borderRadius: '14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Account Information
              </Typography>
              <Stack spacing={1.2} sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B' }}>
                    <EmailIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Email
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    {profile?.email || user.email}
                  </Typography>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B' }}>
                    <CalendarMonthIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Member Since
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Saved Delivery Address Card */}
            <Box
              sx={{
                p: 2,
                borderRadius: '14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <LocationOnIcon sx={{ color: '#FF7A00', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Saved Delivery Address
                  </Typography>
                </Box>
                {!isEditingAddress && (
                  <Button
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 13 }} />}
                    onClick={() => {
                      setAddressInput(profile?.address || user?.address || '');
                      setIsEditingAddress(true);
                    }}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#FF7A00',
                      p: 0,
                      minWidth: 'auto',
                      '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                    }}
                  >
                    {profile?.address || user?.address ? 'Edit' : '+ Add Address'}
                  </Button>
                )}
              </Box>

              {isEditingAddress ? (
                <Box sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Enter flat / house no., street, landmark, city, pincode..."
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        backgroundColor: '#F8FAFC',
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
                    <Button
                      size="small"
                      onClick={() => setIsEditingAddress(false)}
                      disabled={isSavingAddress}
                      sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleSaveAddress}
                      disabled={isSavingAddress || !addressInput.trim()}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        backgroundColor: '#FF7A00',
                        color: '#FFFFFF',
                        px: 2,
                        '&:hover': { backgroundColor: '#E06500' },
                      }}
                    >
                      {isSavingAddress ? <CircularProgress size={14} color="inherit" /> : 'Save Address'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ mt: 0.5 }}>
                  {profile?.address || user?.address ? (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500, fontSize: '0.85rem', lineHeight: 1.5 }}>
                        {profile?.address || user?.address}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      No address saved yet. Save your address here for automatic pre-fill during checkout.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            {/* Recent Orders Section */}
            {profile?.recentOrders && profile.recentOrders.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Recent Orders
                  </Typography>
                  <Button
                    component={Link}
                    href="/my-orders"
                    onClick={onClose}
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#FF7A00', p: 0 }}
                  >
                    View All
                  </Button>
                </Box>
                <Stack spacing={1}>
                  {profile.recentOrders.map((ord) => {
                    const statusStyle = getStatusColor(ord.status);
                    return (
                      <Box
                        key={ord.id}
                        sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
                            Order #{ord.id.slice(0, 8)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                            {ord.store?.name || 'Restaurant Outlet'} • {new Date(ord.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                            ₹{Number(ord.total_amount).toFixed(2)}
                          </Typography>
                          <Chip
                            label={ord.status}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.text,
                              border: `1px solid ${statusStyle.border}`,
                              borderRadius: '4px',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button
          onClick={() => {
            onClose();
            logout();
          }}
          startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
          color="error"
          variant="outlined"
          size="small"
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.8rem',
            borderColor: '#FCA5A5',
            '&:hover': { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
          }}
        >
          Log Out
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          size="small"
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.8rem',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            px: 2.5,
            '&:hover': { backgroundColor: '#1E293B' },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
