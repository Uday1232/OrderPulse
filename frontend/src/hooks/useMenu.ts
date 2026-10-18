'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { Category, Item } from '../types/order';

export function useMenu(storeId: string) {
  const queryClient = useQueryClient();

  const menuQuery = useQuery({
    queryKey: ['menu', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const res = await ApiService.getStoreMenu(storeId);
      const data = res.data as unknown as { categories?: Category[] } | Category[];
      if (data && 'categories' in data && Array.isArray(data.categories)) {
        return data.categories;
      }
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(storeId),
    staleTime: 5 * 60 * 1000,
  });

  const createItemMutation = useMutation({
    mutationFn: (formData: FormData) => ApiService.createStoreItem(storeId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', storeId] });
    },
  });

  const categories: Category[] = Array.isArray(menuQuery.data) ? menuQuery.data : [];

  // Flatten all items across categories for easy searching and grid rendering
  const allItems: Item[] = categories.flatMap((cat: Category) =>
    (cat.items || []).map((item) => ({
      ...item,
      category: { id: cat.id, name: cat.name },
    }))
  );

  return {
    categories,
    allItems,
    isLoading: menuQuery.isLoading,
    isError: menuQuery.isError,
    error: menuQuery.error,
    fromCache: menuQuery.data ? true : false,
    refetch: menuQuery.refetch,
    createItem: createItemMutation.mutateAsync,
    isCreatingItem: createItemMutation.isPending,
  };
}
