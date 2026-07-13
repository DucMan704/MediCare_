import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

// Lấy URL backend từ biến môi trường
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// --- CẤU HÌNH BIẾN PHỤC VỤ HÀNG ĐỢI CHỐNG LỖI KÉP ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- CẤU HÌNH BỘ ĐÁNH CHẶN (INTERCEPTOR) CHO RESPONSES ---
axios.interceptors.response.use(
  (response) => {
    // Nếu API gọi thành công, cứ trả về kết quả bình thường
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu Backend báo lỗi 401 hoặc 403 và request này chưa từng thử refresh lần nào
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Đánh dấu là đã thử lại

      // 🛑 TRƯỜNG HỢP 1: ĐANG CÓ REQUEST REFRESH TOKEN ĐANG CHẠY
      // Cho các request bị lỗi sau đó vào hàng đợi, chờ lấy token mới
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["token"] = token;
            return axios(originalRequest); // Chạy lại request ban đầu với token mới
          })
          .catch((err) => Promise.reject(err));
      }

      // 🚀 TRƯỜNG HỢP 2: ĐÂY LÀ REQUEST ĐẦU TIÊN BỊ LỖI (TIẾN HÀNH REFRESH)
      isRefreshing = true;

      try {
        // 1. Tự động gọi API refresh-token ở Backend
        const { data } = await axios.post(
          `${backendUrl}/api/user/refresh-token`,
          {},
          { withCredentials: true },
        );

        if (data.success) {
          // 2. Lấy được Access Token mới -> Lưu ngay vào Local Storage
          localStorage.setItem("token", data.token);

          // Cập nhật token cho request hiện tại
          originalRequest.headers["token"] = data.token;

          // 3. Giải phóng toàn bộ các request đang nghẽn trong hàng đợi
          processQueue(null, data.token);

          // 4. Bắn request hiện tại đi lại lần nữa
          return axios(originalRequest);
        } else {
          // Nếu data trả về success = false (dù không văng catch)
          throw new Error("Refresh token không thành công");
        }
      } catch (refreshError) {
        // Kích hoạt lỗi cho tất cả request đang đợi trong hàng
        processQueue(refreshError, null);

        // NẾU REFRESH TOKEN CŨNG HẾT HẠN HOẶC LỖI THÌ ĐÁNG XUẤT
        console.warn("Phiên đăng nhập đã hết hạn hoàn toàn!");
        localStorage.removeItem("token");

        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");

        // Chuyển hướng về trang login
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);

        return Promise.reject(refreshError);
      } finally {
        // Luôn luôn reset lại cờ sau khi xử lý xong (dù thành công hay thất bại)
        isRefreshing = false;
      }
    }

    // Các lỗi khác (500, 404, v.v.) thì trả về bình thường
    return Promise.reject(error);
  },
);

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = import.meta.env.VITE_CURRENCY?.trim() || "₹";
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : "",
  );
  const [userData, setUserData] = useState(false);

  // Getting Doctors using API
  const getDoctosData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/list");
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Getting User Profile using API
  const loadUserProfileData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/get-profile", {
        headers: { token },
      });

      if (data.success) {
        // CẬP NHẬT DÒNG NÀY: Dùng data.user thay vì data.userData
        // (Hoặc dùng fallback data.userData || data.user cho an toàn)
        setUserData(data.user || data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getDoctosData();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    }
  }, [token]);

  const value = {
    doctors,
    getDoctosData,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
