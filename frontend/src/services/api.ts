import { Order, PaginatedOrdersResponse, AnalyticsResponse, OrderStatus } from '../types/order';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export class ApiService {
  /**
   * Fetch orders for a store with cursor-based pagination
   */
  static async getOrders(params: {
    store_id: string;
    cursor?: string | null;
    limit?: number;
    status?: OrderStatus | '';
  }): Promise<PaginatedOrdersResponse> {
    const query = new URLSearchParams();
    query.set('store_id', params.store_id);
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE_URL}/orders?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch orders: HTTP ${res.status}`);
    }

    return res.json();
  }

  /**
   * Fetch a single order by ID
   */
  static async getOrderById(orderId: string): Promise<{ success: boolean; data: Order }> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch order: HTTP ${res.status}`);
    }

    return res.json();
  }

  /**
   * Create a new order
   */
  static async createOrder(data: {
    store_id: string;
    items: Array<{ name: string; quantity: number; unit_price: number }>;
  }): Promise<{ success: boolean; data: Order; message: string }> {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.details?.[0]?.message || `Failed to create order: HTTP ${res.status}`);
    }

    return res.json();
  }

  /**
   * Update order status with row-level locking on backend
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<{ success: boolean; data: Order; message: string }> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update order status: HTTP ${res.status}`);
    }

    return res.json();
  }

  /**
   * Fetch aggregated analytics
   */
  static async getAnalytics(forceRefresh = false): Promise<AnalyticsResponse> {
    const url = `${API_BASE_URL}/analytics${forceRefresh ? '?refresh=true' : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch analytics: HTTP ${res.status}`);
    }

    return res.json();
  }

  /**
   * Trigger archival of orders older than 30 days
   */
  static async archiveOldOrders(daysThreshold = 30): Promise<{
    success: boolean;
    data: { archivedCount: number; daysThreshold: number; timestamp: string };
    message: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/archive-old-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days_threshold: daysThreshold }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to archive orders: HTTP ${res.status}`);
    }

    return res.json();
  }
}
