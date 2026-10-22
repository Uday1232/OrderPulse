import {
  CreateOrderSchema,
  GetOrdersQuerySchema,
  UpdateOrderStatusSchema,
  OrderIdParamSchema,
  ArchiveOrdersSchema,
} from '../src/validators/order.schema';

describe('Validation Schemas (Zod)', () => {
  const sampleUuid = '11111111-1111-1111-1111-111111111111';

  describe('CreateOrderSchema', () => {
    it('should validate a valid order payload with payment method', () => {
      const validPayload = {
        store_id: sampleUuid,
        payment_method: 'UPI',
        delivery_address: '123 Test Street, FC Road, Pune',
        items: [
          { name: 'Margherita Pizza', qty: 2, price: 14.99 },
          { name: 'Espresso', qty: 1, price: 3.5 },
        ],
      };

      const result = CreateOrderSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('PLACED');
        expect(result.data.payment_method).toBe('UPI');
        expect(result.data.items.length).toBe(2);
      }
    });

    it('should reject payload with invalid store_id UUID', () => {
      const invalidPayload = {
        store_id: 'not-a-valid-uuid',
        items: [{ name: 'Pizza', qty: 1, price: 10 }],
      };

      const result = CreateOrderSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject payload with empty items array', () => {
      const invalidPayload = {
        store_id: sampleUuid,
        items: [],
      };

      const result = CreateOrderSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject items with negative or zero quantity or price', () => {
      const invalidQuantity = {
        store_id: sampleUuid,
        items: [{ name: 'Pizza', qty: 0, price: 10 }],
      };
      expect(CreateOrderSchema.safeParse(invalidQuantity).success).toBe(false);

      const invalidPrice = {
        store_id: sampleUuid,
        items: [{ name: 'Pizza', qty: 1, price: -5 }],
      };
      expect(CreateOrderSchema.safeParse(invalidPrice).success).toBe(false);
    });
  });

  describe('GetOrdersQuerySchema', () => {
    it('should validate query with store_id and default limit to 10', () => {
      const query = { store_id: sampleUuid };
      const result = GetOrdersQuerySchema.safeParse(query);
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
      const result = GetOrdersQuerySchema.safeParse({ store_id: sampleUuid, limit: 500 });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateOrderStatusSchema', () => {
    it('should accept valid status values: PENDING, PLACED, PREPARED, CANCELLED', () => {
      expect(UpdateOrderStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(true);
      expect(UpdateOrderStatusSchema.safeParse({ status: 'PLACED' }).success).toBe(true);
      expect(UpdateOrderStatusSchema.safeParse({ status: 'PREPARED' }).success).toBe(true);
      expect(UpdateOrderStatusSchema.safeParse({ status: 'CANCELLED' }).success).toBe(true);
    });

    it('should reject invalid status value', () => {
      expect(UpdateOrderStatusSchema.safeParse({ status: 'DELIVERED' }).success).toBe(false);
      expect(UpdateOrderStatusSchema.safeParse({ status: 'UNKNOWN' }).success).toBe(false);
    });
  });

  describe('OrderIdParamSchema', () => {
    it('should accept valid UUID', () => {
      expect(OrderIdParamSchema.safeParse({ id: sampleUuid }).success).toBe(true);
    });

    it('should reject invalid UUID string', () => {
      expect(OrderIdParamSchema.safeParse({ id: '12345' }).success).toBe(false);
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
      const result = ArchiveOrdersSchema.safeParse({ days_threshold: 45 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.days_threshold).toBe(45);
      }
    });

    it('should reject days_threshold <= 0', () => {
      expect(ArchiveOrdersSchema.safeParse({ days_threshold: 0 }).success).toBe(false);
      expect(ArchiveOrdersSchema.safeParse({ days_threshold: -10 }).success).toBe(false);
    });
  });
});
