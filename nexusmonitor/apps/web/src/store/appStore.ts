import { create } from 'zustand';

interface AppStore {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  currentOrg: string | null;
  toggleSidebar: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  setOrg: (id: string) => void;
}

export const useAppStore = create<AppStore>(set => ({
  sidebarOpen: true,
  theme: 'dark',
  currentOrg: null,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setOrg: (id) => set({ currentOrg: id }),
}));
