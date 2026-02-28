import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

/* -------------------------------------------------------
   CONFIGURATION
--------------------------------------------------------*/
const RAILWAY_BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://backend-production-cbbc.up.railway.app/api";

const DEFAULT_PORT = 5000;
const CONNECTION_TIMEOUT = 5000; // 5 seconds for testing connections

/* -------------------------------------------------------
   NETWORK IP AUTO-DETECTION
--------------------------------------------------------*/

/**
 * Storage key for cached backend URL
 */
const BACKEND_URL_CACHE_KEY = "cached_backend_url";

/**
 * Get the local IP address from Expo's hostUri
 */
function getLocalIPAddress(): string {
  try {
    const hostUri = Constants.expoConfig?.hostUri;

    if (!hostUri) {
      console.warn("hostUri not found, using localhost");
      return "localhost";
    }

    // hostUri example: "192.168.1.5:19000"
    const ip = hostUri.split(":")[0];
    return ip;
  } catch (error) {
    console.error("Failed to resolve local IP:", error);
    return "localhost";
  }
}

/**
 * Test if a URL is reachable
 */
async function testConnection(baseUrl: string): Promise<boolean> {
  try {
    const healthUrl = baseUrl.replace("/api", "") + "/health";
    const response = await axios.get(healthUrl, {
      timeout: CONNECTION_TIMEOUT,
      validateStatus: (status) => status === 200,
    });

    return response.data?.status === "healthy";
  } catch (error) {
    return false;
  }
}

/**
 * Fetch available network IPs from backend's health endpoint
 */
async function fetchBackendNetworkIPs(localIP: string): Promise<string | null> {
  const testBaseUrl = `http://${localIP}:${DEFAULT_PORT}/health`;

  try {
    console.log(`Fetching backend network info from: ${testBaseUrl}`);

    const response = await axios.get(testBaseUrl, {
      timeout: CONNECTION_TIMEOUT,
    });

    if (response.data?.server?.networkInterfaces) {
      const networkInterfaces = response.data.server.networkInterfaces;

      // Try each network interface in order
      for (const iface of networkInterfaces) {
        const testUrl = `http://${iface.address}:${DEFAULT_PORT}/api`;
        console.log(`Testing connection to: ${testUrl}`);

        const isReachable = await testConnection(testUrl);
        if (isReachable) {
          console.log(`Successfully connected to: ${testUrl}`);
          return testUrl;
        }
      }
    }

    // Fallback to the IP we used to fetch
    const fallbackUrl = `http://${localIP}:${DEFAULT_PORT}/api`;
    console.log(`Using fallback URL: ${fallbackUrl}`);
    return fallbackUrl;
  } catch (error: any) {
    console.error("Failed to fetch backend network info:", error.message);
    return null;
  }
}

/**
 * Get or detect the best backend URL
 */
async function getBackendURL(): Promise<string> {
  // Production mode - use Railway URL
  if (!__DEV__) {
    console.log("Production mode - using Railway backend");
    return RAILWAY_BACKEND_URL;
  }

  console.log("🔧 Development mode - detecting local backend...");

  // Check cache first
  try {
    const cachedUrl = await SecureStore.getItemAsync(BACKEND_URL_CACHE_KEY);
    if (cachedUrl) {
      console.log(`Found cached URL: ${cachedUrl}`);

      // Test if cached URL still works
      const isValid = await testConnection(cachedUrl);
      if (isValid) {
        console.log("Cached URL is valid");
        return cachedUrl;
      } else {
        console.log("Cached URL is no longer valid, re-detecting...");
        await SecureStore.deleteItemAsync(BACKEND_URL_CACHE_KEY);
      }
    }
  } catch (error) {
    console.error("Error reading cached URL:", error);
  }

  // Get local IP from Expo
  const localIP = getLocalIPAddress();
  console.log(`Device local IP: ${localIP}`);

  // Try to fetch backend's actual network IPs
  const detectedUrl = await fetchBackendNetworkIPs(localIP);

  if (detectedUrl) {
    // Cache the successful URL
    try {
      await SecureStore.setItemAsync(BACKEND_URL_CACHE_KEY, detectedUrl);
      console.log(`Cached backend URL: ${detectedUrl}`);
    } catch (error) {
      console.error("Failed to cache URL:", error);
    }

    return detectedUrl;
  }

  // Final fallback - use localhost
  const fallbackUrl = `http://${localIP}:${DEFAULT_PORT}/api`;
  console.log(`Using final fallback: ${fallbackUrl}`);
  return fallbackUrl;
}

/* -------------------------------------------------------
   INITIALIZE API BASE URL
--------------------------------------------------------*/
let API_BASE_URL = RAILWAY_BACKEND_URL; // Default for immediate use

// Async initialization
(async () => {
  try {
    API_BASE_URL = await getBackendURL();
    console.log("API Base URL initialized:", API_BASE_URL);
    console.log("Environment:", __DEV__ ? "Development" : "Production");
  } catch (error) {
    console.error("Failed to initialize API URL:", error);
    console.log("Using default URL:", API_BASE_URL);
  }
})();

/**
 * Force refresh the backend URL (useful for manual refresh)
 */
export async function refreshBackendURL(): Promise<string> {
  console.log("Manually refreshing backend URL...");

  // Clear cache
  try {
    await SecureStore.deleteItemAsync(BACKEND_URL_CACHE_KEY);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }

  // Re-detect
  const newUrl = await getBackendURL();
  API_BASE_URL = newUrl;

  // Recreate axios instance with new URL
  api.defaults.baseURL = newUrl;

  console.log("Backend URL refreshed:", newUrl);
  return newUrl;
}

/**
 * Get the current API base URL
 */
export function getCurrentApiUrl(): string {
  return API_BASE_URL;
}

/* -------------------------------------------------------
   IMAGE URL HELPER
--------------------------------------------------------*/
export const getImageUrl = (
  imagePath: string | null | undefined,
): string | null => {
  if (!imagePath) return null;

  // Get base URL without /api
  const baseUrl = API_BASE_URL.replace("/api", "");

  // imagePath is like "uploads/equipment/image.jpg"
  return `${baseUrl}/${imagePath}`;
};

/* -------------------------------------------------------
   AXIOS SETUP
--------------------------------------------------------*/
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* -------------------------------------------------------
   TOKEN MANAGEMENT
--------------------------------------------------------*/
const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("authToken");
  } catch {
    return null;
  }
};

const setToken = async (token: string): Promise<void> => {
  try {
    // Ensure token is a string
    if (!token || typeof token !== "string") {
      console.error("Invalid token type:", typeof token);
      throw new Error("Token must be a non-empty string");
    }

    await SecureStore.setItemAsync("authToken", token);
    console.log("Token saved successfully");
  } catch (error) {
    console.error("Error saving token:", error);
    throw error;
  }
};

const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync("authToken");
  } catch (error) {
    console.error("Error removing token:", error);
  }
};

/* -------------------------------------------------------
   REQUEST INTERCEPTOR (adds token + auto URL refresh)
--------------------------------------------------------*/
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Update baseURL dynamically in case it changed
    config.baseURL = API_BASE_URL;

    // Add auth token
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* -------------------------------------------------------
   RESPONSE INTERCEPTOR (handles expired token + connection errors)
--------------------------------------------------------*/
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle connection errors in development
    if (
      __DEV__ &&
      (error.code === "ECONNREFUSED" ||
        error.code === "ENOTFOUND" ||
        error.code === "ETIMEDOUT") &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      console.log("Connection failed, attempting to refresh backend URL...");

      try {
        const newUrl = await refreshBackendURL();
        console.log(`Retrying request with new URL: ${newUrl}`);

        // Retry the original request with new URL
        return api.request(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh backend URL:", refreshError);
        return Promise.reject(error);
      }
    }

    // Handle 401 (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await removeToken();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

/* -------------------------------------------------------
   API TYPES
--------------------------------------------------------*/
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
}

export interface BookingRequest {
  equipment_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose?: string;
}

/* -------------------------------------------------------
   AUTH API
--------------------------------------------------------*/
export const authAPI = {
  login: (data: LoginRequest) => api.post("/auth/login", data),
  register: (data: RegisterRequest) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  verifyToken: () => api.get("/auth/verify"),
  forgotPassword: (email: string, clientType: "mobile" | "web" = "mobile") =>
    api.post(
      "/auth/forgot-password",
      { email },
      {
        headers: {
          "X-Client-Type": clientType,
        },
      },
    ),

  resetPassword: (token: string, newPassword: string) =>
    api.post("/auth/reset-password", { token, newPassword }),
};

/* -------------------------------------------------------
   USER API
--------------------------------------------------------*/
export const userAPI = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: any) => api.put("/user/profile", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put("/user/change-password", { currentPassword, newPassword }),
  uploadImage: (formData: FormData) =>
    api.post("/user/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteImage: () => api.delete("/user/delete-image"),
  getDashboard: () => api.get("/user/dashboard"),
  getProductivityReport: (params?: any) =>
    api.get("/user/productivity-report", { params }),
};

/* -------------------------------------------------------
   EQUIPMENT API
--------------------------------------------------------*/
export const equipmentAPI = {
  getAll: (params?: any) => api.get("/equipment", { params }),
  getById: (id: number) => api.get(`/equipment/${id}`),
  create: (formData: FormData) =>
    api.post("/equipment", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, formData: FormData) =>
    api.put(`/equipment/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: number) => api.delete(`/equipment/${id}`),
  uploadImage: (id: number, formData: FormData) =>
    api.post(`/equipment/${id}/upload-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteImage: (id: number) => api.delete(`/equipment/${id}/delete-image`),
  getAnalytics: (id: number, params?: any) =>
    api.get(`/equipment/${id}/analytics`, { params }),
};

/* -------------------------------------------------------
   BOOKING API
--------------------------------------------------------*/
export const bookingAPI = {
  create: (data: BookingRequest) => api.post("/bookings", data),
  getMyBookings: (params?: any) => api.get("/bookings/my-bookings", { params }),
  getAll: (params?: any) => api.get("/bookings", { params }),
  approve: (id: number, remarks?: string) =>
    api.put(`/bookings/${id}/approve`, { remarks }),
  reject: (id: number, remarks?: string) =>
    api.put(`/bookings/${id}/reject`, { remarks }),
  cancel: (id: number) => api.put(`/bookings/${id}/cancel`),
  getAvailableSlots: (equipmentId: number, date: string) =>
    api.get("/bookings/available-slots", {
      params: { equipment_id: equipmentId, date },
    }),
};

/* -------------------------------------------------------
   USAGE API
--------------------------------------------------------*/
export const usageAPI = {
  startSession: (bookingId: number) =>
    api.post("/usage/start", { booking_id: bookingId }),
  endSession: (sessionId: number, notes?: string) =>
    api.post("/usage/end", { session_id: sessionId, notes }),
  getMySessions: (params?: any) => api.get("/usage/my-sessions", { params }),
  getAll: (params?: any) => api.get("/usage", { params }),
  getByEquipment: (equipmentId: number, params?: any) =>
    api.get(`/usage/equipment/${equipmentId}`, { params }),
};

/* -------------------------------------------------------
   ACTIVITY API
--------------------------------------------------------*/
export const activityAPI = {
  getMyActivity: (params?: any) => api.get("/activity/my-activity", { params }),
  getAll: (params?: any) => api.get("/activity/all", { params }),
  getNotifications: (params?: any) =>
    api.get("/activity/notifications", { params }),
  markNotificationRead: (id: number) =>
    api.put(`/activity/notifications/${id}/read`),
  addPrintLog: (data: any) => api.post("/activity/print-logs", data),
  getMyPrintLogs: (params?: any) =>
    api.get("/activity/my-print-logs", { params }),
  getLogbook: (params?: any) => api.get("/activity/logbook", { params }),
  signOut: () => api.post("/activity/sign-out"),
  signIn: () => api.post("/activity/sign-in"),
};

/* -------------------------------------------------------
   ADMIN API
--------------------------------------------------------*/
export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getEquipmentUtilization: () => api.get("/admin/equipment-utilization"),
  getUserProductivity: () => api.get("/admin/user-productivity"),
  getBookingAnalytics: () => api.get("/admin/booking-analytics"),
  getAllUsers: (params?: any) => api.get("/admin/users", { params }),
  toggleUserStatus: (id: number) => api.put(`/admin/users/${id}/toggle-status`),
  getMachineUtilizationAnalytics: (params?: any) =>
    api.get("/admin/machine-analytics", { params }),
  getPeakHoursAnalysis: () => api.get("/admin/peak-hours"),
  getDailyUsagePatterns: (params?: any) =>
    api.get("/admin/daily-patterns", { params }),
  getUserDetails: (id: number) => api.get(`/admin/users/${id}/details`),
  getLabLogbook: (params?: any) => api.get("/activity/logbook", { params }),
};

export { getToken, removeToken, setToken };
export default api;