import { create } from 'zustand';
import { logout, type AuthUser } from '../lib/api';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  setAuth: (user) => set({ user, token: user.access_token }),
  clearAuth: () => set({ user: null, token: null }),
  signOut: async () => {
    const { token } = get();
    if (token) {
      logout(token).catch(() => {});
    }
    set({ user: null, token: null });
  },
}));
