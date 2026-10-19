'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { Store } from '../types/order';

export function useStores() {
  const queryClient = useQueryClient();

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await ApiService.getStores();
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const createStoreMutation = useMutation({
    mutationFn: (data: { name: string; location: string }) => ApiService.createStore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: ({ storeId, data }: { storeId: string; data: { name?: string; location?: string; is_active?: boolean } }) =>
      ApiService.updateStore(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: (storeId: string) => ApiService.deleteStore(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  return {
    stores: storesQuery.data || [],
    isLoading: storesQuery.isLoading,
    isError: storesQuery.isError,
    error: storesQuery.error,
    refetch: storesQuery.refetch,
    createStore: createStoreMutation.mutateAsync,
    isCreating: createStoreMutation.isPending,
    updateStore: updateStoreMutation.mutateAsync,
    isUpdating: updateStoreMutation.isPending,
    deleteStore: deleteStoreMutation.mutateAsync,
    isDeleting: deleteStoreMutation.isPending,
  };
}
