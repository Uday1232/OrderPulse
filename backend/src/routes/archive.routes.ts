import { Router } from 'express';
import { ArchiveController } from '../controllers/archive.controller';
import { validateRequest } from '../middlewares/validate';
import { ArchiveOrdersSchema } from '../validators/order.schema';

const router = Router();

// POST /archive-old-orders - Move orders older than 30 days to orders_archive
router.post(
  '/',
  validateRequest({ body: ArchiveOrdersSchema }),
  ArchiveController.archiveOldOrders
);

export default router;
