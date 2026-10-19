'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!isAdmin) {
        // Staff or regular users with role USER are restricted to the POS Cafe service
        router.replace('/pos');
      }
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading || !user || !isAdmin) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 70px)',
          gap: 2,
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
        }}
      >
        <CircularProgress size={36} sx={{ color: '#FF7A00' }} />
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          Verifying administrator permissions...
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
