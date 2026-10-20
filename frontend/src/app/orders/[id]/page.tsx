import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import OrderDetailsClient from './OrderDetailsClient';

export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

interface PageProps {
  params: { id: string };
}

export default function OrderDetailsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#3B82F6' }} />
        </Box>
      }
    >
      <OrderDetailsClient initialOrderId={params?.id} />
    </Suspense>
  );
}
