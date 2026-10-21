'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AnalyticsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)', gap: 2 }}>
      <CircularProgress sx={{ color: '#FF7A00' }} />
      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
        Redirecting to Analytics Dashboard...
      </Typography>
    </Box>
  );
}
