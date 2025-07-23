import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  admin: { id: string; username: string; email: string } | null;
  setAuth: (token: string, admin: any) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      setAuth: (token, admin) => set({ token, admin }),
      clearAuth: () => set({ token: null, admin: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "auth-storage",
    }
  )
);

export function getAuthToken() {
  return useAuthStore.getState().token;
}

export function isAuthenticated() {
  return useAuthStore.getState().isAuthenticated();
}
