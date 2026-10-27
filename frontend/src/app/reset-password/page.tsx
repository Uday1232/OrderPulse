'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Paper,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSnackbar } from 'notistack';

import { ApiService } from '../../services/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Auto redirect upon success
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSuccess && countdown === 0) {
      router.push('/login');
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrorMessage('Reset token is missing. Please request a new link.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await ApiService.resetPassword({
        token,
        new_password: newPassword,
      });

      setIsSuccess(true);
      enqueueSnackbar(res.message || 'Password reset successful!', {
        variant: 'success',
        autoHideDuration: 4000,
      });
    } catch (err: unknown) {
      const msg =
        (err as Error).message ||
        'Failed to reset password. The link may have expired or was already used.';
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
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 460,
          p: { xs: 3.5, sm: 4.5 },
          borderRadius: '24px',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)',
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Brand Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF7A00',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            }}
          >
            <StorefrontIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                color: '#0F172A',
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
              }}
            >
              ORDER<span style={{ color: '#FF7A00' }}>PULSE</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Cloud Restaurant POS
            </Typography>
          </Box>
        </Box>

        {/* Missing Token Warning */}
        {!token && (
          <Box>
            <Alert
              icon={<ErrorOutlineIcon fontSize="inherit" />}
              severity="warning"
              sx={{ borderRadius: '12px', mb: 3 }}
            >
              Invalid or missing password reset link. Security tokens are required to verify account ownership.
            </Alert>
            <Button
              component={Link}
              href="/login?mode=forgot"
              variant="contained"
              fullWidth
              startIcon={<ArrowBackIcon />}
              sx={{
                py: 1.3,
                borderRadius: '12px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#1E293B' },
              }}
            >
              Request a New Link
            </Button>
          </Box>
        )}

        {/* Success View */}
        {token && isSuccess && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                backgroundColor: '#ECFDF5',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 40 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              Password Reset Complete!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3.5, lineHeight: 1.6 }}>
              Your password has been successfully updated. You can now use your new credentials to sign in.
            </Typography>

            <Alert severity="info" sx={{ borderRadius: '12px', mb: 3, justifyContent: 'center' }}>
              Redirecting to Sign In in <strong>{countdown}</strong> seconds...
            </Alert>

            <Button
              component={Link}
              href="/login"
              variant="contained"
              fullWidth
              sx={{
                py: 1.3,
                borderRadius: '12px',
                backgroundColor: '#FF7A00',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#E06500' },
                boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
              }}
            >
              Sign In Now
            </Button>
          </Box>
        )}

        {/* Password Reset Form */}
        {token && !isSuccess && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
              Set New Password
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Enter your new password below. Make sure it is at least 6 characters long.
            </Typography>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
                {errorMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.8, fontSize: '0.85rem' }}>
                  New Password
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
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
                      '&.Mui-focused fieldset': { borderColor: '#FF7A00' },
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.8, fontSize: '0.85rem' }}>
                  Confirm New Password
                </Typography>
                <TextField
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
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
                      '&.Mui-focused fieldset': { borderColor: '#FF7A00' },
                    },
                  }}
                />
              </Box>

              {/* Password checks indicator */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.8 }}>
                  Password Requirements:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: newPassword.length >= 6 ? '#10B981' : '#CBD5E1',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: newPassword.length >= 6 ? '#065F46' : '#64748B' }}>
                    At least 6 characters
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor:
                        newPassword && confirmPassword && newPassword === confirmPassword ? '#10B981' : '#CBD5E1',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        newPassword && confirmPassword && newPassword === confirmPassword ? '#065F46' : '#64748B',
                    }}
                  >
                    Passwords match
                  </Typography>
                </Box>
              </Box>

              <Button
                type="submit"
                disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                variant="contained"
                fullWidth
                sx={{
                  py: 1.4,
                  borderRadius: '12px',
                  backgroundColor: '#FF7A00',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#E06500' },
                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                }}
              >
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Update Password'}
              </Button>

              <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                <Button
                  component={Link}
                  href="/login"
                  startIcon={<ArrowBackIcon />}
                  size="small"
                  sx={{
                    color: '#64748B',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    '&:hover': { color: '#0F172A', backgroundColor: 'transparent' },
                  }}
                >
                  Back to Sign In
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
          <CircularProgress sx={{ color: '#FF7A00' }} />
        </Box>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
