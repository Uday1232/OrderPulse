import { prisma } from '../config/db';
import { RedisService } from './redis.service';
import { NotFoundError } from '../middlewares/errorHandler';
import { CreateStoreInput, CreateCategoryInput, CreateItemInput } from '../validators/store.schema';
import { logger } from '../utils/logger';

export class StoreService {
  private static readonly MENU_CACHE_TTL = 600; // 10 minutes

  /**
   * Return all store locations (public)
   */
  static async getAllStores() {
    return prisma.store.findMany({
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
            categories: true,
            orders: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Create a new store location (Admin only)
   */
  static async createStore(input: CreateStoreInput, adminId: string) {
    const store = await prisma.store.create({
      data: {
        name: input.name.trim(),
        location: input.location.trim(),
        admin_id: adminId,
      },
    });

    logger.info(`Store created: ${store.name} (${store.id}) by Admin ${adminId}`);

    // Create default starter categories for convenience
    const defaultCategories = ['Main Menu', 'Appetizer', 'Beverages'];
    for (const catName of defaultCategories) {
      await prisma.category.create({
        data: {
          name: catName,
          store_id: store.id,
        },
      });
    }

    return store;
  }

  /**
   * Get categorized items filtered by store location with Redis caching (10-minute TTL)
   */
  static async getStoreMenu(storeId: string, forceRefresh = false) {
    const cacheKey = `menu:${storeId}`;

    if (!forceRefresh) {
      const cached = await RedisService.get(cacheKey);
      if (cached) {
        logger.debug(`Cache HIT for store menu: ${storeId}`);
        return cached;
      }
    }

    logger.debug(`Cache MISS for store menu: ${storeId}. Fetching from DB...`);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        categories: {
          include: {
            items: {
              orderBy: { price: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!store) {
      throw new NotFoundError(`Store with ID ${storeId} not found`);
    }

    const result = {
      store: {
        id: store.id,
        name: store.name,
        location: store.location,
      },
      categories: store.categories,
      totalItems: store.categories.reduce((acc, cat) => acc + cat.items.length, 0),
    };

    // Cache in Redis for 10 minutes
    await RedisService.set(cacheKey, result, this.MENU_CACHE_TTL);

    return result;
  }

  /**
   * Create a new category for a store
   */
  static async createCategory(storeId: string, input: CreateCategoryInput) {
    const storeExists = await prisma.store.findUnique({ where: { id: storeId } });
    if (!storeExists) {
      throw new NotFoundError(`Store with ID ${storeId} not found`);
    }

    const category = await prisma.category.create({
      data: {
        name: input.name.trim(),
        store_id: storeId,
      },
    });

    await RedisService.del(`menu:${storeId}`);
    return category;
  }

  /**
   * Create a new menu item for a store (Admin only)
   */
  static async createItem(storeId: string, input: CreateItemInput) {
    const storeExists = await prisma.store.findUnique({ where: { id: storeId } });
    if (!storeExists) {
      throw new NotFoundError(`Store with ID ${storeId} not found`);
    }

    const categoryExists = await prisma.category.findFirst({
      where: { id: input.category_id, store_id: storeId },
    });
    if (!categoryExists) {
      throw new NotFoundError(`Category with ID ${input.category_id} not found in this store`);
    }

    const item = await prisma.item.create({
      data: {
        name: input.name.trim(),
        description: input.description || '',
        price: input.price,
        image_url: input.image_url || '/images/food/burger.jpg',
        rating: input.rating || 4.5,
        category_id: input.category_id,
        store_id: storeId,
      },
    });

    logger.info(`Item created: ${item.name} ($${item.price}) for Store ${storeId}`);

    // Invalidate menu cache
    await RedisService.del(`menu:${storeId}`);

    return item;
  }

  /**
   * Get flat list of items for a store (for table management)
   */
  static async getStoreItems(storeId: string) {
    return prisma.item.findMany({
      where: { store_id: storeId },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
