import { create } from 'zustand';
import { Item, PaymentMethod } from '../types/order';

export interface CartLineItem {
  item_id: string;
  name: string;
  price: number;
  qty: number;
  image_url?: string;
}

interface CartState {
  items: CartLineItem[];
  inspectedItem: Item | null;
  inspectionQty: number;
  isCheckoutOpen: boolean;
  paymentMethod: PaymentMethod;

  // Actions
  addItem: (item: Item, qty?: number) => void;
  updateQty: (itemId: string, delta: number) => void;
  setItemQty: (itemId: string, qty: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  setInspectedItem: (item: Item | null) => void;
  setInspectionQty: (qty: number) => void;
  incrementInspectionQty: () => void;
  decrementInspectionQty: () => void;

  setIsCheckoutOpen: (open: boolean) => void;
  setPaymentMethod: (method: PaymentMethod) => void;

  // Computed helpers
  getTotalCount: () => number;
  getTotalAmount: () => number;
  getItemQtyInCart: (itemId: string) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  inspectedItem: null,
  inspectionQty: 1,
  isCheckoutOpen: false,
  paymentMethod: 'CASH',

  addItem: (item: Item, qty = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.item_id === item.id);
      if (existingIndex > -1) {
        const updated = [...state.items];
        const existing = updated[existingIndex]!;
        updated[existingIndex] = {
          ...existing,
          qty: existing.qty + qty,
        };
        return { items: updated };
      }
      return {
        items: [
          ...state.items,
          {
            item_id: item.id,
            name: item.name,
            price: item.price,
            qty,
            image_url: item.image_url || undefined,
          },
        ],
      };
    });
  },

  updateQty: (itemId: string, delta: number) => {
    set((state) => {
      const updated = state.items
        .map((i) => {
          if (i.item_id === itemId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter((i): i is CartLineItem => i !== null);

      return { items: updated };
    });
  },

  setItemQty: (itemId: string, qty: number) => {
    set((state) => {
      if (qty <= 0) {
        return { items: state.items.filter((i) => i.item_id !== itemId) };
      }
      return {
        items: state.items.map((i) => (i.item_id === itemId ? { ...i, qty } : i)),
      };
    });
  },

  removeItem: (itemId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.item_id !== itemId),
    }));
  },

  clearCart: () => {
    set({ items: [], isCheckoutOpen: false });
  },

  setInspectedItem: (item: Item | null) => {
    set({ inspectedItem: item, inspectionQty: 1 });
  },

  setInspectionQty: (qty: number) => {
    set({ inspectionQty: Math.max(1, qty) });
  },

  incrementInspectionQty: () => {
    set((state) => ({ inspectionQty: state.inspectionQty + 1 }));
  },

  decrementInspectionQty: () => {
    set((state) => ({ inspectionQty: Math.max(1, state.inspectionQty - 1) }));
  },

  setIsCheckoutOpen: (open: boolean) => {
    set({ isCheckoutOpen: open });
  },

  setPaymentMethod: (method: PaymentMethod) => {
    set({ paymentMethod: method });
  },

  getTotalCount: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },

  getTotalAmount: () => {
    return Number(get().items.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2));
  },

  getItemQtyInCart: (itemId: string) => {
    const item = get().items.find((i) => i.item_id === itemId);
    return item ? item.qty : 0;
  },
}));
