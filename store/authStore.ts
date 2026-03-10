import { create } from "zustand";
import { authAPI, setToken, removeToken } from "@/lib/api";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  department?: string;
  profile_image?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // 🔐 LOGIN
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Attempting login for:", email);
      const res = await authAPI.login({ email, password });

      console.log("Login response:", res.data);

      // The backend returns { success: true, token: "...", user: {...} }
      const token = res.data.token;
      const user = res.data.user;

      // Validate token
      if (!token || typeof token !== "string") {
        throw new Error("Invalid token received from server");
      }

      console.log("Saving token...");
      await setToken(token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log("Login successful, redirecting...");
      router.replace(user.role === "admin" ? "/(admin)" : "/(tabs)");
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Login failed";

      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  // 📝 REGISTER
  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Attempting registration for:", data.email);
      const res = await authAPI.register(data);

      console.log("Register response:", res.data);

      // The backend returns { success: true, token: "...", user: {...} }
      const token = res.data.token;
      const user = res.data.user;

      // Validate token
      if (!token || typeof token !== "string") {
        throw new Error("Invalid token received from server");
      }

      console.log("Saving token...");
      await setToken(token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log("Registration successful, redirecting...");
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Registration error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Registration failed";

      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  // 🚪 LOGOUT
  logout: async () => {
    set({ isLoading: true });
    try {
      console.log("Logging out...");
      await authAPI.logout();
    } catch (e) {
      console.warn("Logout API call failed:", e);
    } finally {
      await removeToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      console.log("Logged out successfully");
      router.replace("/(auth)/login");
    }
  },

  clearError: () => set({ error: null }),

  // 🔍 CHECK AUTH ON APP LOAD
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      console.log("Checking authentication...");

      // First, check if we have a token
      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        console.log("No token found");
        throw new Error("No token found");
      }

      console.log("Token found, verifying...");

      // Verify token with backend
      const res = await authAPI.verifyToken();
      const user = res.data.user;

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log("Authentication verified for:", user.email);
    } catch (error) {
      console.log("Authentication check failed:", error);
      await removeToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
