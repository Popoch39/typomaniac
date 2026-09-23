import { create } from "zustand";

type DemoState = {
  clicks: number;
  increment: () => void;
  reset: () => void;
};

// Placeholder store that fixes the Zustand convention until a real client-side state exists.
export const useDemoStore = create<DemoState>()((set) => ({
  clicks: 0,
  increment: () => set((state) => ({ clicks: state.clicks + 1 })),
  reset: () => set({ clicks: 0 }),
}));
