import { prisma } from '../config/db';
import { RedisService } from './redis.service';
import { NotFoundError } from '../middlewares/errorHandler';
import { CreateStoreInput, UpdateStoreInput, CreateCategoryInput, CreateItemInput, UpdateItemInput } from '../validators/store.schema';
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
   * Update an existing store location (Admin only)
   */
  static async updateStore(storeId: string, input: UpdateStoreInput) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundError(`Store with ID ${storeId} not found`);
    }

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.location ? { location: input.location.trim() } : {}),
        ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      },
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
    });

    await RedisService.del(`menu:${storeId}`);
    logger.info(`Store updated: ${updated.name} (${updated.id}) - Active: ${updated.is_active}`);
    return updated;
  }

  /**
   * Delete a store location (Admin only)
   */
  static async deleteStore(storeId: string) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundError(`Store with ID ${storeId} not found`);
    }

    // Clean up associated records before deletion
    await prisma.orderArchive.deleteMany({ where: { store_id: storeId } });
    await prisma.order.deleteMany({ where: { store_id: storeId } });
    await prisma.item.deleteMany({ where: { store_id: storeId } });
    await prisma.category.deleteMany({ where: { store_id: storeId } });

    await prisma.store.delete({ where: { id: storeId } });
    await RedisService.del(`menu:${storeId}`);
    logger.info(`Store deleted: ${store.name} (${storeId})`);
    return { success: true, message: `Store "${store.name}" deleted successfully` };
  }

  /**
   * Create a new menu item for a store (Admin only)
   */
  static async createItem(storeId: string, input: CreateItemInput) {
    const storeExists = await prisma.store.findUnique({ where: { id: storeId } });
    if (!storeExists) {
      throw new NotFoundError(`Store with ID ${storeId} not found`);
    }

    let categoryId = input.category_id;

    // If category_id was not provided but category_name was, find or create category
    if (!categoryId && input.category_name) {
      let cat = await prisma.category.findFirst({
        where: { name: input.category_name.trim(), store_id: storeId },
      });
      if (!cat) {
        cat = await prisma.category.create({
          data: { name: input.category_name.trim(), store_id: storeId },
        });
      }
      categoryId = cat.id;
    }

    // If still no categoryId, fallback to the store's first category or create 'Main Menu'
    if (!categoryId) {
      let defaultCat = await prisma.category.findFirst({
        where: { store_id: storeId },
      });
      if (!defaultCat) {
        defaultCat = await prisma.category.create({
          data: { name: 'Main Menu', store_id: storeId },
        });
      }
      categoryId = defaultCat.id;
    } else {
      const categoryExists = await prisma.category.findFirst({
        where: { id: categoryId, store_id: storeId },
      });
      if (!categoryExists) {
        throw new NotFoundError(`Category with ID ${categoryId} not found in this store`);
      }
    }

    const item = await prisma.item.create({
      data: {
        name: input.name.trim(),
        description: input.description || '',
        price: input.price,
        image_url: input.image_url || '/images/food/burger.jpg',
        rating: input.rating || 4.5,
        category_id: categoryId,
        store_id: storeId,
      },
      include: {
        category: true,
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

  /**
   * Update an existing menu item (Admin only)
   */
  static async updateItem(storeId: string, itemId: string, input: UpdateItemInput) {
    const item = await prisma.item.findFirst({
      where: { id: itemId, store_id: storeId },
    });
    if (!item) {
      throw new NotFoundError(`Item with ID ${itemId} not found in this store`);
    }

    let categoryId = input.category_id;
    if (!categoryId && input.category_name) {
      let cat = await prisma.category.findFirst({
        where: { name: input.category_name.trim(), store_id: storeId },
      });
      if (!cat) {
        cat = await prisma.category.create({
          data: { name: input.category_name.trim(), store_id: storeId },
        });
      }
      categoryId = cat.id;
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.image_url ? { image_url: input.image_url } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    await RedisService.del(`menu:${storeId}`);
    logger.info(`Item updated: ${updated.name} (${updated.id}) - Active: ${updated.is_active}`);
    return updated;
  }

  /**
   * Delete an existing menu item (Admin only)
   */
  static async deleteItem(storeId: string, itemId: string) {
    const item = await prisma.item.findFirst({
      where: { id: itemId, store_id: storeId },
    });
    if (!item) {
      throw new NotFoundError(`Item with ID ${itemId} not found in this store`);
    }

    await prisma.item.delete({ where: { id: itemId } });
    await RedisService.del(`menu:${storeId}`);
    logger.info(`Item deleted: ${item.name} (${itemId})`);
    return { success: true, message: `Item "${item.name}" deleted successfully` };
  }
}

