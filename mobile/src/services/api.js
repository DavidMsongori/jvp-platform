
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
console.log("JVP API BASE URL:", API_BASE_URL);

if (!API_BASE_URL) {
  console.warn("EXPO_PUBLIC_API_URL is not configured.");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Attach the saved authentication token to requests.
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication and server errors.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      await SecureStore.deleteItemAsync("token");
    }

    if (status >= 500) {
      console.error("JVP Connect server error.");
    }

    return Promise.reject(error);
  }
);

export default api;
