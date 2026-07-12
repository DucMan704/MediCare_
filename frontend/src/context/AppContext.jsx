import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

// Lấy URL backend từ biến môi trường
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Cấu hình bộ đánh chặn (Interceptor) cho toàn bộ request Axios
axios.interceptors.response.use(
  (response) => {
    // Nếu API gọi thành công, cứ trả về kết quả bình thường
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu Backend báo lỗi 401 hoặc 403 (Token hết hạn/lỗi) và chưa thử refresh lần nào
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Đánh dấu là đang thử lại để không bị lặp vô hạn

      try {
        // 1. Tự động gọi API refresh-token ở Backend
        const { data } = await axios.post(
          `${backendUrl}/api/user/refresh-token`,
          {},
          {
            withCredentials: true,
          },
        );

        if (data.success) {
          // 2. Lấy được Access Token mới -> Lưu ngay vào Local Storage
          localStorage.setItem("token", data.token);

          // 3. Cập nhật lại cái thẻ mới cho request lúc nãy bị thất bại
          originalRequest.headers["token"] = data.token;

          // 4. Bắn request đi lại lần nữa, mọi thứ lại chạy mượt mà!
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // NẾU REFRESH TOKEN CŨNG HẾT HẠN HOẶC LỖI THÌ SAO?
        // -> Xóa sạch dấu vết và "đá" người dùng ra trang Login
        console.warn("Phiên đăng nhập đã hết hạn hoàn toàn!");
        localStorage.removeItem("token");

        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");

        // Chuyển hướng về trang login
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);

        return Promise.reject(refreshError);
      }
    }

    // Các lỗi khác (500, 404, v.v.) thì trả về bình thường để catch block ở hàm xử lý
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
