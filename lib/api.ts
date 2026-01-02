import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

/* -------------------------------------------------------
   AUTO-DETECT LOCAL IP (NO MORE MANUAL CHANGES)
--------------------------------------------------------*/
function getLocalIPAddress() {
  try {
    let host = Constants.expoConfig?.hostUri; // example -> "10.42.1.122:19000"
    if (!host) return "http://localhost:5000/api";

    let ip = host.split(":")[0]; // extract → "10.42.1.122"
    return `http://${ip}:5000/api`;
  } catch (err) {
    console.log("Error detecting IP:", err);
    return "http://localhost:5000/api";
  }
}

// API Base URL (automatic in dev, production fixed)
const API_BASE_URL = __DEV__
  ? getLocalIPAddress()
  : "https://your-production-api.com/api";

console.log("🔗 API Base URL:", API_BASE_URL);

export const getImageUrl = (
  imagePath: string | null | undefined
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
    await SecureStore.setItemAsync("authToken", token);
  } catch (error) {
    console.error("Error saving token:", error);
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
   REQUEST INTERCEPTOR (adds token automatically)
--------------------------------------------------------*/
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* -------------------------------------------------------
   RESPONSE INTERCEPTOR (handles expired token)
--------------------------------------------------------*/
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await removeToken();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
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
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
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
};

export { getToken, removeToken, setToken };
export default api;
