import {
  Order,
  PaginatedOrdersResponse,
  AnalyticsResponse,
  OrderStatus,
  Store,
  Category,
  Item,
  User,
  PaymentMethod,
  PaymentStatus,
} from '../types/order';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tmbill_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

export class ApiService {
  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================
  static async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; data: { token: string; user: User } }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Login failed: HTTP ${res.status}`);
    }

    return res.json();
  }

  static async register(data: {
    name: string;
    email: string;
    password: string;
    role?: 'ADMIN' | 'USER';
  }): Promise<{ success: boolean; data: { token: string; user: User } }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Registration failed: HTTP ${res.status}`);
    }

    return res.json();
  }

  static async getMe(): Promise<{ success: boolean; data: { user: User } }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch user profile: HTTP ${res.status}`);
    }

    return res.json();
  }

  // ==========================================
  // STORE ENDPOINTS
  // ==========================================
  static async getStores(): Promise<{ success: boolean; data: Store[] }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/stores`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch stores: HTTP ${res.status}`);
    }

    return res.json();
  }

  static async createStore(data: {
    name: string;
    location: string;
  }): Promise<{ success: boolean; data: Store; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create store: HTTP ${res.status}`);
    }

    return res.json();
  }

  // ==========================================
  // DYNAMIC MENU & ITEM ENDPOINTS
  // ==========================================
  static async getStoreMenu(
    storeId: string
  ): Promise<{ success: boolean; data: Category[]; fromCache?: boolean }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/stores/${storeId}/menu`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch store menu: HTTP ${res.status}`);
    }

    return res.json();
  }

  static async createStoreItem(
    storeId: string,
    formData: FormData
  ): Promise<{ success: boolean; data: Item; message: string }> {
    const authHeader = getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/v1/stores/${storeId}/items`, {
      method: 'POST',
      headers: {
        ...authHeader,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create item: HTTP ${res.status}`);
    }

    return res.json();
  }

  // ==========================================
  // ORDER ENDPOINTS
  // ==========================================
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

    const res = await fetch(`${API_BASE_URL}/api/v1/orders?${query.toString()}`, {
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

  static async getOrderById(orderId: string): Promise<{ success: boolean; data: Order }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`, {
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

  static async createOrder(data: {
    store_id: string;
    user_id?: string | null;
    items: Array<{ item_id?: string; name: string; qty?: number; quantity?: number; price?: number; unit_price?: number }>;
    payment_method?: PaymentMethod;
    payment_status?: PaymentStatus;
    status?: OrderStatus;
  }): Promise<{ success: boolean; data: Order; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.details?.[0]?.message || `Failed to create order: HTTP ${res.status}`);
    }

    return res.json();
  }

  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<{ success: boolean; data: Order; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update order status: HTTP ${res.status}`);
    }

    return res.json();
  }

  static async getAnalytics(forceRefresh = false): Promise<AnalyticsResponse> {
    const url = `${API_BASE_URL}/api/v1/analytics${forceRefresh ? '?refresh=true' : ''}`;
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

  static async archiveOldOrders(daysThreshold = 30): Promise<{
    success: boolean;
    data: { archivedCount: number; daysThreshold: number; timestamp: string };
    message: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/archive-old-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ days_threshold: daysThreshold }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to archive orders: HTTP ${res.status}`);
    }

    return res.json();
  }
}
