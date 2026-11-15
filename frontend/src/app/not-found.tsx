'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

export default function NotFound() {
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
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: 300, sm: 500 },
          height: { xs: 300, sm: 500 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 122, 0, 0.12) 0%, rgba(13, 17, 26, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Container maxWidth="sm" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Brand Icon Header */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 122, 0, 0.15)',
            border: '2px solid rgba(255, 122, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            color: '#FF7A00',
            boxShadow: '0 8px 30px rgba(255, 122, 0, 0.25)',
          }}
        >
          <PointOfSaleIcon sx={{ fontSize: 38 }} />
        </Box>

        {/* 404 Display */}
        <Typography
          variant="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '5.5rem', sm: '7.5rem' },
            letterSpacing: '-0.04em',
            lineHeight: 1,
            background: 'linear-gradient(135deg, #FF7A00 0%, #FFA800 50%, #FFFFFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1.5,
          }}
        >
          404
        </Typography>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: '#F8FAFC',
            mb: 1.5,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          Dish Not Found on Our Menu!
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#94A3B8',
            maxWidth: 440,
            mx: 'auto',
            mb: 4,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6,
          }}
        >
          The page or restaurant outlet you are trying to visit doesn’t exist, was moved, or is temporarily out of service.
        </Typography>

        {/* Navigation Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            component={Link}
            href="/pos"
            variant="contained"
            size="large"
            startIcon={<RestaurantMenuIcon />}
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
            Back to Order Menu
          </Button>

          <Button
            component={Link}
            href="/my-orders"
            variant="outlined"
            size="large"
            startIcon={<ShoppingBagIcon />}
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
            View My Orders
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
