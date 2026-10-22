export type Role = 'SUPERADMIN' | 'ADMIN' | 'USER';

export type OrderStatus = 'PENDING' | 'PLACED' | 'PREPARED' | 'CANCELLED' | 'PREPARING' | 'COMPLETED';

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
}

export interface UserProfile extends User {
  ordersCount?: number;
  storesCount?: number;
  recentOrders?: Array<{
    id: string;
    total_amount: number;
    status: OrderStatus;
    created_at: string;
    store: {
      id: string;
      name: string;
      location: string;
    };
  }>;
  managedStores?: Array<{
    id: string;
    name: string;
    location: string;
    is_active?: boolean;
  }>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  is_active?: boolean;
  admin_id?: string;
  created_at?: string;
  _count?: {
    order?: number;
    item?: number;
    category?: number;
  };
}

export interface Category {
  id: string;
  name: string;
  store_id: string;
  items?: Item[];
}

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  rating?: number;
  category_id: string;
  store_id: string;
  is_active?: boolean;
  created_at?: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface OrderItem {
  item_id?: string;
  name: string;
  qty: number;
  quantity?: number;
  price: number;
  unit_price?: number;
  subtotal?: number;
}

export interface Order {
  id: string;
  store_id: string;
  user_id?: string | null;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
  store?: {
    id?: string;
    name?: string;
    location?: string;
  } | null;
}

export interface OrderArchive extends Order {}

export interface PaginatedOrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    totalReturned: number;
  };
}

export interface DailyOrderStat {
  date: string;
  order_count: number;
  daily_revenue: number;
}

export interface StoreRevenueStat {
  store_id: string;
  store_name?: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface TopSellingItemStat {
  item_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  totalStores: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    summary: AnalyticsSummary;
    ordersPerDay: DailyOrderStat[];
    revenuePerStore: StoreRevenueStat[];
    topSellingItems: TopSellingItemStat[];
    cachedAt: string;
    fromCache: boolean;
  };
}

export interface StoreInfo {
  id: string;
  name: string;
  location: string;
}

export const AVAILABLE_STORES: StoreInfo[] = [
  { id: 'central-store-01', name: 'Central Cafe & Bistro', location: '101 Main St, Downtown' },
  { id: 'uptown-store-02', name: 'Uptown Pizzeria & Grill', location: '404 High St, Uptown' },
  { id: 'suburban-store-03', name: 'Suburban Gourmet House', location: '707 Oak Ave, Suburbia' },
];

export const POPULAR_MENU_PRESETS = [
  { name: 'Veg. Mania Burger with lettuce', unit_price: 16.36 },
  { name: 'Italian Veg. Sandwich Classic', unit_price: 16.54 },
  { name: 'Turkish Cuisine Pizza', unit_price: 22.54 },
  { name: 'Mexican Patty With Veg. Sammi', unit_price: 8.28 },
  { name: 'Crispy French Fries Golden', unit_price: 6.99 },
  { name: 'Artisan Hot-Coffee Latte', unit_price: 4.50 },
];

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

