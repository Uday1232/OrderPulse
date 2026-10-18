'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { OrderStatus, PaymentMethod } from '../types/order';

export function useOrders(params: {
  storeId: string;
  cursor?: string | null;
  limit?: number;
  status?: OrderStatus | '';
}) {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['orders', params.storeId, params.cursor, params.limit, params.status],
    queryFn: () =>
      ApiService.getOrders({
        store_id: params.storeId,
        cursor: params.cursor,
        limit: params.limit,
        status: params.status || undefined,
      }),
    enabled: Boolean(params.storeId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) =>
      ApiService.updateOrderStatus(orderId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData: {
      store_id: string;
      user_id?: string | null;
      items: Array<{ item_id?: string; name: string; qty: number; price: number }>;
      payment_method?: PaymentMethod;
    }) => ApiService.createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  return {
    orders: ordersQuery.data?.data || [],
    pagination: ordersQuery.data?.pagination,
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    createOrder: createOrderMutation.mutateAsync,
    isCreatingOrder: createOrderMutation.isPending,
  };
}
