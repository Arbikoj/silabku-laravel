import axios from "axios";

const BASE_URL = (import.meta.env.VITE_APP_URL || "") + "/api";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token invalid atau expired. Redirect ke login...");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
