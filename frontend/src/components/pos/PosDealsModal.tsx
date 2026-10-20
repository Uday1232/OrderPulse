'use client';

import React from 'react';
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
  Grid,
  Card,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';

import { useOfferStore, DealOffer } from '../../store/useOfferStore';
import { useAuthStore } from '../../store/useAuthStore';

interface PosDealsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectDeal?: (offer: DealOffer) => void;
}

export function PosDealsModal({ open, onClose, onSelectDeal }: PosDealsModalProps) {
  const { offers, appliedOffer, applyOffer } = useOfferStore();
  const { isAdmin } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const activeOffers = offers.filter((o) => o.isActive);

  const handleApply = (offer: DealOffer) => {
    applyOffer(offer);
    if (onSelectDeal) onSelectDeal(offer);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '20px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 3,
          backgroundColor: '#FFF7ED',
          borderBottom: '1px solid #FED7AA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: '#FF7A00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
            }}
          >
            <LocalFireDepartmentIcon sx={{ fontSize: 26, color: '#FFFFFF' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
              Best Offers & Live Deals
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Select a promotional discount to automatically apply at checkout
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        {activeOffers.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8' }}>
            <ConfirmationNumberIcon sx={{ fontSize: 52, color: '#CBD5E1', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
              No Active Offers Right Now
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              Check back soon or ask your store administrator to enable promotional campaigns.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {activeOffers.map((offer) => {
              const isApplied = appliedOffer?.id === offer.id;

              return (
                <Grid item xs={12} sm={6} key={offer.id}>
                  <Card
                    sx={{
                      p: 2.5,
                      borderRadius: '16px',
                      border: isApplied ? '2px solid #FF7A00' : '1px solid #E2E8F0',
                      backgroundColor: isApplied ? '#FFFBF5' : '#FFFFFF',
                      boxShadow: isApplied ? '0 8px 24px rgba(255, 122, 0, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                      '&:hover': {
                        borderColor: '#FF7A00',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
                      },
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={offer.code}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            fontSize: '0.75rem',
                            backgroundColor: '#FFEDD5',
                            color: '#EA580C',
                          }}
                        />
                        {offer.badgeText && (
                          <Chip
                            label={offer.badgeText}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                            }}
                          />
                        )}
                      </Box>

                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.8 }}>
                        {offer.title}
                      </Typography>

                      <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.825rem' }}>
                        {offer.description}
                      </Typography>

                      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 900,
                            color: '#FF7A00',
                            fontSize: '1.25rem',
                          }}
                        >
                          {offer.discountType === 'PERCENT'
                            ? `${offer.discountValue}% OFF`
                            : `$${offer.discountValue.toFixed(2)} FLAT`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          {offer.minOrderAmount > 0 ? `(Min Order $${offer.minOrderAmount.toFixed(2)})` : '(No Minimum Order)'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2.5 }}>
                      <Button
                        fullWidth
                        onClick={() => handleApply(offer)}
                        variant={isApplied ? 'outlined' : 'contained'}
                        startIcon={isApplied ? <CheckCircleIcon /> : <ConfirmationNumberIcon />}
                        sx={{
                          borderRadius: '12px',
                          py: 1,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          backgroundColor: isApplied ? 'transparent' : '#FF7A00',
                          color: isApplied ? '#FF7A00' : '#FFFFFF',
                          borderColor: '#FF7A00',
                          '&:hover': {
                            backgroundColor: isApplied ? 'rgba(255, 122, 0, 0.08)' : '#E06500',
                            borderColor: '#E06500',
                          },
                        }}
                      >
                        {isApplied ? 'Deal Applied to Cart' : 'Apply Deal Now'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ p: 2.5, px: 3, borderTop: '1px solid #F1F5F9', justifyContent: 'space-between' }}>
        {isAdmin ? (
          <Button
            component={Link}
            href="/admin/offers"
            startIcon={<SettingsIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: '#3B82F6',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none',
            }}
          >
            Manage Offers in Admin Suite
          </Button>
        ) : (
          <Box />
        )}

        <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
