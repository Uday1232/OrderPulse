'use client';

import React from 'react';
import { Box, Skeleton, Grid, Container } from '@mui/material';

export default function Loading() {
  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
      {/* 1. Left Sidebar Skeleton (Desktop only) */}
      <Box
        sx={{
          width: { xs: 260, xl: 280 },
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          p: 2.5,
          borderRight: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          gap: 2,
        }}
      >
        <Skeleton variant="text" width="50%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" width="100%" height={42} sx={{ borderRadius: '10px' }} />
        <Skeleton variant="rounded" width="100%" height={42} sx={{ borderRadius: '10px' }} />
        <Skeleton variant="rounded" width="100%" height={42} sx={{ borderRadius: '10px' }} />

        <Skeleton variant="text" width="40%" height={20} sx={{ mt: 3, mb: 1 }} />
        <Skeleton variant="rounded" width="100%" height={80} sx={{ borderRadius: '12px' }} />
        <Skeleton variant="rounded" width="100%" height={120} sx={{ borderRadius: '12px', mt: 1 }} />

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: '12px' }} />
        </Box>
      </Box>

      {/* 2. Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Skeleton */}
        <Box
          sx={{
            py: 1.5,
            px: { xs: 2, sm: 3 },
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Skeleton
            variant="rounded"
            width={320}
            height={42}
            sx={{ borderRadius: '12px', flex: { xs: '1 1 100%', md: '0 1 360px' } }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant="rounded" width={200} height={42} sx={{ borderRadius: '12px' }} />
            <Skeleton variant="rounded" width={90} height={42} sx={{ borderRadius: '12px' }} />
            <Skeleton variant="rounded" width={80} height={42} sx={{ borderRadius: '12px' }} />
          </Box>
        </Box>

        {/* Dishes Feed Skeleton */}
        <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
          {/* Category Chips Shimmer */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, overflowX: 'hidden' }}>
            {[80, 110, 95, 105, 90, 115, 100].map((w, idx) => (
              <Skeleton
                key={idx}
                variant="rounded"
                width={w}
                height={38}
                sx={{ borderRadius: '10px', flexShrink: 0 }}
              />
            ))}
          </Box>

          {/* Dishes Count Banner Shimmer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Skeleton variant="text" width={180} height={32} />
            <Skeleton variant="text" width={120} height={24} />
          </Box>

          {/* Item Cards Grid Shimmer */}
          <Grid container spacing={2.5}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((cardIdx) => (
              <Grid item xs={12} sm={6} md={4} xl={3} key={cardIdx}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '20px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Skeleton
                    variant="rounded"
                    width="100%"
                    height={140}
                    sx={{ borderRadius: '14px' }}
                    animation="wave"
                  />
                  <Skeleton variant="text" width="70%" height={24} sx={{ mt: 0.5 }} />
                  <Skeleton variant="text" width="40%" height={18} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 1 }}>
                    <Skeleton variant="text" width="30%" height={28} />
                    <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: '8px' }} />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
