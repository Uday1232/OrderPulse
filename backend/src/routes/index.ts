import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import storeRoutes from './store.routes';
import orderRoutes from './order.routes';
import archiveRoutes from './archive.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'restaurant-pos-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount resource routes
router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/orders', orderRoutes);
router.use('/archive-old-orders', archiveRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
