import axios from "axios";

/* ==========================================
   AXIOS INSTANCE
========================================== */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

/* ==========================================
   REQUEST INTERCEPTOR
========================================== */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ==========================================
   RESPONSE INTERCEPTOR
========================================== */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("member");
    }

    if (status === 403) {
      console.warn("Access denied.");
    }

    if (status >= 500) {
      console.error(
        "Server error. Please try again later."
      );
    }

    return Promise.reject(error);
  }
);

export default api;