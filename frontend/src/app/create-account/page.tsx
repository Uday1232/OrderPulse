'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../hooks/useAuth';

export default function CreateAccountPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/pos');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    const resolvedName = name.trim() || trimmedEmail.split('@')[0] || 'Customer';

    if (!trimmedEmail) {
      const msg = 'Please enter a valid email address.';
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: 'warning', autoHideDuration: 3500 });
      return;
    }

    if (!password) {
      const msg = 'Please create a secure password.';
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: 'warning', autoHideDuration: 3500 });
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: 'warning', autoHideDuration: 3500 });
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match. Please verify.';
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: 'warning', autoHideDuration: 3500 });
      return;
    }

    setIsLoading(true);

    try {
      const data = await register({
        name: resolvedName,
        email: trimmedEmail,
        password,
        role: 'USER',
      });

      enqueueSnackbar(`Welcome, ${data.user.name}! Your account has been created successfully.`, {
        variant: 'success',
        autoHideDuration: 4000,
      });

      router.push('/pos');
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to create account. Please check your details.';
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: 'error', autoHideDuration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: 'calc(100vh - 70px)',
        backgroundColor: '#F8FAFC',
      }}
    >
      {/* Left Promo Branding Section (Desktop) */}
      <Box
        sx={{
          flex: '1 1 50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          position: 'relative',
          backgroundImage:
            'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url(/images/login-banner.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#FFFFFF',
        }}
      >
        {/* Brand Header */}
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
            }}
          >
            <StorefrontIcon sx={{ fontSize: 28, color: '#FFFFFF' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              StorePulse
            </Typography>
            <Typography variant="caption" sx={{ color: '#E2E8F0', letterSpacing: '0.04em' }}>
              Multi-Store Order Platform
            </Typography>
          </Box>
        </Box>

        {/* Hero Headline */}
        <Box sx={{ my: 'auto', maxWidth: 480 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            Join StorePulse.{' '}
            <span style={{ color: '#FF7A00' }}>Order faster and track live.</span>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#CBD5E1',
              lineHeight: 1.7,
              fontSize: '1.05rem',
              mb: 3,
            }}
          >
            Create an account to explore authentic dishes across all branches, save your delivery address, and receive live kitchen order updates.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <CheckCircleOutlineIcon sx={{ color: '#FF7A00', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 500 }}>
                Automatic address prefill on every checkout
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <CheckCircleOutlineIcon sx={{ color: '#FF7A00', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 500 }}>
                Real-time live kitchen preparation status
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <CheckCircleOutlineIcon sx={{ color: '#FF7A00', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 500 }}>
                Instant digital receipt and order history
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer info */}
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          © 2026 StorePulse OS. Multi-Store POS Platform.
        </Typography>
      </Box>

      {/* Right Registration Form Section */}
      <Box
        sx={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 5 },
          backgroundColor: '#FFFFFF',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Back link */}
          <Button
            component={Link}
            href="/pos"
            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
            sx={{
              mb: 2,
              color: '#64748B',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              p: 0,
              '&:hover': { color: '#0F172A', backgroundColor: 'transparent' },
            }}
          >
            Back to Menu
          </Button>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              mb: 0.8,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.75rem', sm: '2rem' },
            }}
          >
            Create New Account
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
            Sign up to place orders and manage your deliveries
          </Typography>

          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                borderRadius: '12px',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #FCA5A5',
                fontWeight: 600,
                '& .MuiAlert-icon': {
                  color: '#DC2626',
                },
              }}
            >
              {errorMessage}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.6, display: 'block' }}>
                Full Name
              </Typography>
              <TextField
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.6, display: 'block' }}>
                Email Address *
              </Typography>
              <TextField
                fullWidth
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.6, display: 'block' }}>
                Password * (min. 6 characters)
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: '#94A3B8' }}
                      >
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.6, display: 'block' }}>
                Confirm Password *
              </Typography>
              <TextField
                fullWidth
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: '#94A3B8' }}
                      >
                        {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                    },
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              disabled={isLoading}
              variant="contained"
              sx={{
                mt: 1.5,
                py: 1.4,
                borderRadius: '12px',
                backgroundColor: '#FF7A00',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.98rem',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                '&:hover': { backgroundColor: '#E06500' },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create New Account'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Already have an account?{' '}
                <Typography
                  component={Link}
                  href="/login"
                  variant="body2"
                  sx={{
                    color: '#FF7A00',
                    fontWeight: 700,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign In
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
