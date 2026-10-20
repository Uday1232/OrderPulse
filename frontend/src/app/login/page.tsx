'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
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
import { useSnackbar } from 'notistack';

import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      const msg = 'Please enter both email and password.';
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: 'warning', autoHideDuration: 3500 });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await login({ email, password });
      enqueueSnackbar(`Welcome back, ${data.user.name}! Sign-in successful.`, {
        variant: 'success',
        autoHideDuration: 4000,
      });

      if (data.user.role === 'SUPERADMIN' || data.user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/pos');
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Invalid email or password';
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: 'error', autoHideDuration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      const msg = 'Please enter email and password.';
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

    setIsLoading(true);
    setErrorMessage(null);

    const resolvedName = name.trim() || email.split('@')[0] || 'Customer';

    try {
      const data = await register({ name: resolvedName, email: email.trim(), password, role: 'USER' });
      enqueueSnackbar(`Welcome, ${data.user.name}! Your account has been created.`, {
        variant: 'success',
        autoHideDuration: 4000,
      });

      router.push('/pos');
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Registration failed';
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
      {/* Left Promo Branding Section */}
      <Box
        sx={{
          flex: '1 1 50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          position: 'relative',
          backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(/images/login-banner.jpg)',
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
              Multi-Store Order Management
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
            Manage every store.{' '}
            <span style={{ color: '#FF7A00' }}>Track every order.</span>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#CBD5E1',
              lineHeight: 1.7,
              fontSize: '1.05rem',
            }}
          >
            A simple and powerful platform to manage orders, monitor multiple stores, and grow your restaurant business with real-time analytics.
          </Typography>
        </Box>

        {/* Footer info */}
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          © 2026 StorePulse OS. Production-ready restaurant POS platform.
        </Typography>
      </Box>

      {/* Right Login Form Section */}
      <Box
        sx={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 4 },
          backgroundColor: '#FFFFFF',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 1, letterSpacing: '-0.02em', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
            {isRegistering
              ? 'Register a new customer or staff account'
              : 'Sign in to your account to continue'}
          </Typography>

          {/* Sign In vs Register Mode Switcher */}
          <Box sx={{ display: 'flex', gap: 1, p: 0.6, backgroundColor: '#F1F5F9', borderRadius: '12px', mb: 3 }}>
            <Button
              fullWidth
              onClick={() => { setIsRegistering(false); setErrorMessage(null); }}
              sx={{
                py: 0.8,
                borderRadius: '9px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                backgroundColor: !isRegistering ? '#FFFFFF' : 'transparent',
                color: !isRegistering ? '#0F172A' : '#64748B',
                boxShadow: !isRegistering ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                '&:hover': { backgroundColor: !isRegistering ? '#FFFFFF' : '#E2E8F0' },
              }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              onClick={() => { setIsRegistering(true); setErrorMessage(null); }}
              sx={{
                py: 0.8,
                borderRadius: '9px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                backgroundColor: isRegistering ? '#FFFFFF' : 'transparent',
                color: isRegistering ? '#0F172A' : '#64748B',
                boxShadow: isRegistering ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                '&:hover': { backgroundColor: isRegistering ? '#FFFFFF' : '#E2E8F0' },
              }}
            >
              New User Register
            </Button>
          </Box>

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
            onSubmit={isRegistering ? handleSignUp : handleSignIn}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {isRegistering && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                  Full Name
                </Typography>
                <TextField
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '12px',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      '& fieldset': { borderColor: '#E2E8F0' },
                    },
                  }}
                />
              </Box>
            )}

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                Email
              </Typography>
              <TextField
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRegistering ? 'john@example.com' : 'you@example.com'}
                type="email"
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    '& fieldset': { borderColor: '#E2E8F0' },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                Password
              </Typography>
              <TextField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegistering ? 'At least 6 characters' : '••••••••'}
                type={showPassword ? 'text' : 'password'}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    '& fieldset': { borderColor: '#E2E8F0' },
                  },
                }}
              />
            </Box>

            {!isRegistering && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -0.5 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size="small"
                      sx={{ color: '#CBD5E1', '&.Mui-checked': { color: '#FF7A00' } }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>Remember me</Typography>}
                />
                <Typography
                  variant="body2"
                  component="a"
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    enqueueSnackbar('Password reset link has been dispatched to your email.', {
                      variant: 'info',
                      autoHideDuration: 4000,
                    });
                  }}
                  sx={{ color: '#FF7A00', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Forgot password?
                </Typography>
              </Box>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              variant="contained"
              sx={{
                mt: 1,
                py: 1.4,
                borderRadius: '12px',
                backgroundColor: isRegistering ? '#FF7A00' : '#0F172A',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: isRegistering ? '0 4px 14px rgba(255, 122, 0, 0.35)' : '0 4px 14px rgba(15, 23, 42, 0.25)',
                '&:hover': { backgroundColor: isRegistering ? '#E06500' : '#1E293B' },
              }}
            >
              {isLoading ? (
                <CircularProgress size={22} color="inherit" />
              ) : isRegistering ? (
                'Create Customer Account'
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

