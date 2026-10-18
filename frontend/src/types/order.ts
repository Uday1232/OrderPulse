export type OrderStatus = 'PLACED' | 'PREPARING' | 'COMPLETED';

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  store_id: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

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
  { id: 'store-downtown-01', name: 'Downtown Bistro', location: '101 Main St, Downtown' },
  { id: 'store-uptown-02', name: 'Uptown Pizzeria', location: '404 High St, Uptown' },
  { id: 'store-suburban-03', name: 'Suburban Grill', location: '707 Oak Ave, Suburbia' },
];

export const POPULAR_MENU_PRESETS = [
  { name: 'Margherita Pizza', unit_price: 14.99 },
  { name: 'Truffle Burger', unit_price: 18.50 },
  { name: 'Caesar Salad', unit_price: 11.00 },
  { name: 'Pasta Carbonara', unit_price: 16.75 },
  { name: 'Tiramisu', unit_price: 8.50 },
  { name: 'Espresso', unit_price: 3.50 },
  { name: 'Garlic Knots', unit_price: 6.00 },
];
