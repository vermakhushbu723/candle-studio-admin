import { create } from 'zustand';
import { api } from '@/api/client';

export interface Counts {
  inquiries: number;
  tickets: number;
  orders: number;
  lowStock: number;
}

interface CountsState {
  counts: Counts;
  refresh: () => Promise<void>;
}

/** Badge counts for the sidebar + notification bell. Call refresh() after any inbox change. */
export const useCounts = create<CountsState>()((set) => ({
  counts: { inquiries: 0, tickets: 0, orders: 0, lowStock: 0 },
  refresh: async () => {
    try {
      const r = await api<{ counts: Counts }>('/counts');
      set({ counts: r.counts });
    } catch {
      /* badge counts are non-critical */
    }
  },
}));
