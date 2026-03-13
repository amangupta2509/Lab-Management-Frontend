import api from "./api";

/* ================= LAB INVENTORY ================= */

export const labInventoryAPI = {
  getAll: () => api.get("/inventory/lab"),
  getById: (id: number) => api.get(`/inventory/lab/${id}`),
  create: (data: any) => api.post("/inventory/lab", data),
  update: (id: number, data: any) => api.put(`/inventory/lab/${id}`, data),
  delete: (id: number) => api.delete(`/inventory/lab/${id}`),
};

/* ================= NGS INVENTORY ================= */

export const ngsInventoryAPI = {
  getAll: () => api.get("/inventory/ngs"),
  getById: (id: number) => api.get(`/inventory/ngs/${id}`),
  create: (data: any) => api.post("/inventory/ngs", data),
  update: (id: number, data: any) => api.put(`/inventory/ngs/${id}`, data),
  delete: (id: number) => api.delete(`/inventory/ngs/${id}`),
};

/* ================= PROJECTS ================= */

export const projectsAPI = {
  getAll: () => api.get("/inventory/projects"),
  getById: (id: number) => api.get(`/inventory/projects/${id}`),
  create: (data: any) => api.post("/inventory/projects", data),
  update: (id: number, data: any) => api.put(`/inventory/projects/${id}`, data),
  delete: (id: number) => api.delete(`/inventory/projects/${id}`),
};

/* ================= RUN PLANS ================= */

export const runPlansAPI = {
  getAll: () => api.get("/inventory/runs"),
  getById: (id: number) => api.get(`/inventory/runs/${id}`),
  create: (data: any) => api.post("/inventory/runs", data),
  update: (id: number, data: any) => api.put(`/inventory/runs/${id}`, data),
  delete: (id: number) => api.delete(`/inventory/runs/${id}`),
};

/* ================= TRANSACTIONS ================= */

export const transactionsAPI = {
  getAll: (params?: any) => api.get("/inventory/transactions", { params }),
};

/* ================= CONSUMPTION ================= */

export const consumptionAPI = {
  consume: (data: any) => api.post("/inventory/consume", data),
};

/* ================= ALERTS ================= */

export const inventoryAlertsAPI = {
  getAll: () => api.get("/inventory/alerts"),
  resolve: (id: number) => api.put(`/inventory/alerts/${id}/resolve`),
};
