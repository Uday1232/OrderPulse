import { Request, Response, NextFunction } from 'express';
import { StoreService } from '../services/store.service';
import { CreateStoreInput, UpdateStoreInput, CreateCategoryInput, CreateItemInput } from '../validators/store.schema';

export class StoreController {
  static async getAllStores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StoreService.getAllStores(req.query);
      res.status(200).json({
        success: true,
        data: result.stores,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await StoreService.createStore(req.body as CreateStoreInput, req.user!.id);
      res.status(201).json({
        success: true,
        message: 'Store created successfully',
        data: store,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { store_id } = req.params;
      const store = await StoreService.updateStore(store_id!, req.body as UpdateStoreInput);
      res.status(200).json({
        success: true,
        message: 'Store updated successfully',
        data: store,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { store_id } = req.params;
      const result = await StoreService.deleteStore(store_id!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getStoreMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { store_id } = req.params;
      const forceRefresh = req.query.refresh === 'true';
      const menu = await StoreService.getStoreMenu(store_id!, forceRefresh);
      res.status(200).json({
        success: true,
        data: menu,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { store_id } = req.params;
      const category = await StoreService.createCategory(store_id!, req.body as CreateCategoryInput);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { store_id } = req.params;
      const body = { ...req.body } as CreateItemInput;

      // If an image was uploaded via multer, use its static public path
      if (req.file) {
        body.image_url = `/uploads/${req.file.filename}`;
      } else if (!body.image_url) {
        body.image_url = '/images/food/burger.jpg';
      }

      const item = await StoreService.createItem(store_id!, body);
      res.status(201).json({
        success: true,
        message: 'Item created successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStoreItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { store_id } = req.params;
      const result = await StoreService.getStoreItems(store_id!, req.query);
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { store_id, item_id } = req.params;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const input = {
        ...req.body,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };
      const item = await StoreService.updateItem(store_id!, item_id!, input);
      res.status(200).json({
        success: true,
        message: 'Item updated successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { store_id, item_id } = req.params;
      const result = await StoreService.deleteItem(store_id!, item_id!);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

