import { create } from 'zustand';

export interface DealOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderAmount: number;
  isActive: boolean;
  category?: string;
  badgeText?: string;
  createdAt: string;
}

const DEFAULT_OFFERS: DealOffer[] = [
  {
    id: 'offer-welcome-20',
    code: 'WELCOME20',
    title: '20% Off Welcome Deal',
    description: 'Get 20% off your entire order with no minimum limit',
    discountType: 'PERCENT',
    discountValue: 20,
    minOrderAmount: 0,
    isActive: true,
    category: 'All Items',
    badgeText: '🔥 POPULAR',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'offer-sandwich-15',
    code: 'SANDWICH15',
    title: '15% Off Artisanal Sandwiches & Meals',
    description: 'Save 15% instantly on your current order items',
    discountType: 'PERCENT',
    discountValue: 15,
    minOrderAmount: 0,
    isActive: true,
    category: 'Sandwich',
    badgeText: '🥪 SPECIAL',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'offer-pizza-5',
    code: 'PIZZA5',
    title: '₹50.00 Flat Discount',
    description: 'Flat ₹50.00 instant rebate deducted directly from your order',
    discountType: 'FLAT',
    discountValue: 50.0,
    minOrderAmount: 0,
    isActive: true,
    category: 'Pizza',
    badgeText: '🍕 WEEKEND OFFER',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'offer-happyhour-25',
    code: 'HAPPY25',
    title: '25% Happy Hour Beverages',
    description: 'Special 25% discount on iced teas, coffees, and specialty drinks',
    discountType: 'PERCENT',
    discountValue: 25,
    minOrderAmount: 0,
    isActive: true,
    category: 'Beverages',
    badgeText: '☕ HAPPY HOUR',
    createdAt: new Date().toISOString(),
  },
];

interface OfferStore {
  offers: DealOffer[];
  appliedOffer: DealOffer | null;
  addOffer: (offer: Omit<DealOffer, 'id' | 'createdAt'>) => void;
  updateOffer: (id: string, updates: Partial<DealOffer>) => void;
  deleteOffer: (id: string) => void;
  toggleActive: (id: string) => void;
  applyOffer: (offer: DealOffer | null) => void;
  getActiveOffers: () => DealOffer[];
}

const STORAGE_KEY = 'storepulse_offers_v3';

function getInitialOffers(): DealOffer[] {
  if (typeof window === 'undefined') return DEFAULT_OFFERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_OFFERS));
      return DEFAULT_OFFERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_OFFERS;
  } catch {
    return DEFAULT_OFFERS;
  }
}

function persistOffers(offers: DealOffer[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  } catch {}
}

export const useOfferStore = create<OfferStore>((set, get) => ({
  offers: getInitialOffers(),
  appliedOffer: null,

  addOffer: (offerData) => {
    const newOffer: DealOffer = {
      ...offerData,
      id: `offer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const next = [newOffer, ...state.offers];
      persistOffers(next);
      return { offers: next };
    });
  },

  updateOffer: (id, updates) => {
    set((state) => {
      const next = state.offers.map((o) => (o.id === id ? { ...o, ...updates } : o));
      persistOffers(next);
      return { offers: next };
    });
  },

  deleteOffer: (id) => {
    set((state) => {
      const next = state.offers.filter((o) => o.id !== id);
      persistOffers(next);
      const applied = state.appliedOffer?.id === id ? null : state.appliedOffer;
      return { offers: next, appliedOffer: applied };
    });
  },

  toggleActive: (id) => {
    set((state) => {
      const next = state.offers.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o));
      persistOffers(next);
      return { offers: next };
    });
  },

  applyOffer: (offer) => {
    set({ appliedOffer: offer });
  },

  getActiveOffers: () => {
    return get().offers.filter((o) => o.isActive);
  },
}));
