import {
  CreateOrderSchema,
  GetOrdersQuerySchema,
  UpdateOrderStatusSchema,
  OrderIdParamSchema,
  ArchiveOrdersSchema,
} from '../src/validators/order.schema';

describe('Validation Schemas (Zod)', () => {
  describe('CreateOrderSchema', () => {
    it('should validate a valid order payload', () => {
      const validPayload = {
        store_id: 'store-downtown-01',
        items: [
          { name: 'Margherita Pizza', quantity: 2, unit_price: 14.99 },
          { name: 'Espresso', quantity: 1, unit_price: 3.5 },
        ],
      };

      const result = CreateOrderSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('PLACED');
        expect(result.data.items.length).toBe(2);
      }
    });

    it('should reject payload with empty store_id', () => {
      const invalidPayload = {
        store_id: '',
        items: [{ name: 'Pizza', quantity: 1, unit_price: 10 }],
      };

      const result = CreateOrderSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with empty items array', () => {
      const invalidPayload = {
        store_id: 'store-1',
        items: [],
      };

      const result = CreateOrderSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject items with negative or zero quantity or price', () => {
      const invalidQuantity = {
        store_id: 'store-1',
        items: [{ name: 'Pizza', quantity: 0, unit_price: 10 }],
      };
      expect(CreateOrderSchema.safeParse(invalidQuantity).success).toBe(false);

      const invalidPrice = {
        store_id: 'store-1',
        items: [{ name: 'Pizza', quantity: 1, unit_price: -5 }],
      };
      expect(CreateOrderSchema.safeParse(invalidPrice).success).toBe(false);
    });
  });

  describe('GetOrdersQuerySchema', () => {
    it('should validate query with store_id and default limit to 10', () => {
      const result = GetOrdersQuerySchema.safeParse({ store_id: 'store-1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject missing store_id', () => {
      const result = GetOrdersQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid limit out of range (e.g. 500)', () => {
      const result = GetOrdersQuerySchema.safeParse({ store_id: 'store-1', limit: '500' });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateOrderStatusSchema', () => {
    it('should accept valid status values', () => {
      expect(UpdateOrderStatusSchema.safeParse({ status: 'PLACED' }).success).toBe(true);
      expect(UpdateOrderStatusSchema.safeParse({ status: 'PREPARING' }).success).toBe(true);
      expect(UpdateOrderStatusSchema.safeParse({ status: 'COMPLETED' }).success).toBe(true);
    });

    it('should reject invalid status value', () => {
      expect(UpdateOrderStatusSchema.safeParse({ status: 'SHIPPED' }).success).toBe(false);
    });
  });

  describe('OrderIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(OrderIdParamSchema.safeParse({ id: validUuid }).success).toBe(true);
    });

    it('should reject invalid UUID string', () => {
      expect(OrderIdParamSchema.safeParse({ id: 'non-uuid-string' }).success).toBe(false);
    });
  });

  describe('ArchiveOrdersSchema', () => {
    it('should default days_threshold to 30 when omitted', () => {
      const result = ArchiveOrdersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.days_threshold).toBe(30);
      }
    });

    it('should accept custom valid days_threshold', () => {
      const result = ArchiveOrdersSchema.safeParse({ days_threshold: 15 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.days_threshold).toBe(15);
      }
    });

    it('should reject days_threshold <= 0', () => {
      expect(ArchiveOrdersSchema.safeParse({ days_threshold: 0 }).success).toBe(false);
    });
  });
});
