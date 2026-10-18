import { Router, Request, Response } from 'express';
import orderRoutes from './order.routes';
import archiveRoutes from './archive.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'restaurant-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount resource routes
router.use('/orders', orderRoutes);
router.use('/archive-old-orders', archiveRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
