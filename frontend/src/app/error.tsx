'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Container, Stack, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side exceptions
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0D111A',
        color: '#F8FAFC',
        px: 2,
        py: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient glow */}
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: 300, sm: 500 },
          height: { xs: 300, sm: 500 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, rgba(13, 17, 26, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Container maxWidth="sm" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Error Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '20px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            color: '#EF4444',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.25)',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 40 }} />
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#F8FAFC',
            mb: 1.5,
            fontSize: { xs: '1.5rem', sm: '1.85rem' },
          }}
        >
          Something Went Wrong!
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#94A3B8',
            maxWidth: 440,
            mx: 'auto',
            mb: 3,
            fontSize: { xs: '0.9rem', sm: '0.95rem' },
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred while loading this section of the POS system. Don’t worry, your cart and session data are safe.
        </Typography>

        {error?.message && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{
              maxWidth: 480,
              mx: 'auto',
              mb: 4,
              textAlign: 'left',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              borderRadius: '12px',
              fontSize: '0.82rem',
            }}
          >
            {error.message}
          </Alert>
        )}

        {/* Recovery Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            onClick={() => reset()}
            variant="contained"
            size="large"
            startIcon={<RefreshIcon />}
            sx={{
              backgroundColor: '#FF7A00',
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: '12px',
              px: 3.5,
              py: 1.2,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 4px 16px rgba(255, 122, 0, 0.4)',
              '&:hover': {
                backgroundColor: '#E06500',
                boxShadow: '0 6px 22px rgba(255, 122, 0, 0.55)',
              },
            }}
          >
            Try Again
          </Button>

          <Button
            component={Link}
            href="/pos"
            variant="outlined"
            size="large"
            startIcon={<RestaurantMenuIcon />}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#E2E8F0',
              fontWeight: 700,
              borderRadius: '12px',
              px: 3.5,
              py: 1.2,
              textTransform: 'none',
              fontSize: '0.95rem',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              '&:hover': {
                borderColor: '#FF7A00',
                backgroundColor: 'rgba(255, 122, 0, 0.1)',
                color: '#FF7A00',
              },
            }}
          >
            Return to Order Menu
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
