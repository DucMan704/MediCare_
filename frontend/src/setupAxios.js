// src/setupAxios.js
import axios from "axios";
import { toast } from "react-toastify";

const backendUrl = import.meta.env.VITE_BACKEND_URL; // hoặc đường dẫn bạn đang cấu hình

axios.defaults.withCredentials = true;

const authAxios = axios.create({ withCredentials: true });

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["token"] = token;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["token"] = token;
          return axios(originalRequest);
        });
      }

      isRefreshing = true;
      try {
        const { data } = await authAxios.post(
          `${backendUrl}/api/user/refresh-token`,
        );
        if (!data.success) throw new Error("Refresh token thất bại");

        localStorage.setItem("token", data.token);
        originalRequest.headers["token"] = data.token;

        processQueue(null, data.token);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
        setTimeout(() => (window.location.href = "/login"), 1500);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
