import { Router } from 'express';
import { StoreController } from '../controllers/store.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { validateRequest } from '../middlewares/validate';
import { CreateStoreSchema, CreateCategorySchema, CreateItemSchema } from '../validators/store.schema';

const router = Router();

// GET /stores - Public: Return all store locations
router.get('/', StoreController.getAllStores);

// POST /stores - Admin only: Create new store location
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN'),
  validateRequest({ body: CreateStoreSchema }),
  StoreController.createStore
);

// GET /stores/:store_id/menu - Public: Return categorized items filtered by store location (Redis cached)
router.get('/:store_id/menu', StoreController.getStoreMenu);

// GET /stores/:store_id/items - Return all items for a store
router.get('/:store_id/items', StoreController.getStoreItems);

// POST /stores/:store_id/categories - Admin only: Create category
router.post(
  '/:store_id/categories',
  authenticate,
  authorizeRoles('ADMIN'),
  validateRequest({ body: CreateCategorySchema }),
  StoreController.createCategory
);

// POST /stores/:store_id/items - Admin only: Create item with photo upload via multer
router.post(
  '/:store_id/items',
  authenticate,
  authorizeRoles('ADMIN'),
  upload.single('image'),
  validateRequest({ body: CreateItemSchema }),
  StoreController.createItem
);

export default router;
