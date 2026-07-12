import { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

// Lấy URL backend từ biến môi trường
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Cấu hình bộ đánh chặn (Interceptor) cho toàn bộ request Axios của Doctor
axios.interceptors.response.use(
  (response) => {
    // Nếu API gọi thành công, trả về kết quả bình thường
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
      originalRequest._retry = true; // Đánh dấu để không bị lặp vô hạn nếu refresh thất bại

      try {
        // 1. Tự động gọi API refresh-token dành cho Doctor ở Backend
        // Sử dụng với credentials để gửi kèm cookie HttpOnly chứa refreshToken
        const { data } = await axios.post(
          `${backendUrl}/api/doctor/refresh-token`,
          {},
          { withCredentials: true },
        );

        // Khớp với dữ liệu trả về từ hàm backend (res.json({ accessToken }))
        if (data && data.accessToken) {
          const newAccessToken = data.accessToken;

          // 2. Lưu Access Token mới vào Local Storage (dùng dToken để phân biệt với user)
          localStorage.setItem("dToken", newAccessToken);

          // 3. Cập nhật lại header cho request bị lỗi lúc nãy
          // Lưu ý: Đổi tên header 'token' hoặc 'Authorization' tùy thuộc vào Middleware xác thực ở Backend của bạn
          originalRequest.headers["token"] = newAccessToken;

          // 4. Thực hiện lại request cũ với token mới
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // NẾU REFRESH TOKEN CŨNG HẾT HẠN HOẶC HỢP LỆ (Bị xóa trong DB)
        console.warn("Phiên đăng nhập của Bác sĩ đã hết hạn hoàn toàn!");

        // Xóa sạch token cũ của doctor
        localStorage.removeItem("dToken");

        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");

        // Chuyển hướng bác sĩ về trang đăng nhập dành riêng cho doctor
        setTimeout(() => {
          window.location.href = "/doctor-login";
        }, 1500);

        return Promise.reject(refreshError);
      }
    }

    // Các lỗi khác (500, 404, 400...) thì trả về bình thường
    return Promise.reject(error);
  },
);

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Lấy dToken gọn gàng hơn
  const [dToken, setDToken] = useState(localStorage.getItem("dToken") || "");

  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [profileData, setProfileData] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);

  // ==========================================
  // NHÓM HÀM LẤY DỮ LIỆU (ĐƯA LÊN TRÊN CÙNG)
  // ==========================================

  // Getting Doctor dashboard data using API
  const getDashData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/dashboard", {
        headers: { dtoken: dToken }, // Chuẩn hóa dtoken chữ thường
      });

      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Getting Doctor appointment data from Database using API
  const getAppointments = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/appointments",
        {
          headers: { dtoken: dToken },
        },
      );

      if (data.success) {
        setAppointments(data.appointments.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Getting Doctor profile data from Database using API
  const getProfileData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/profile", {
        headers: { dtoken: dToken },
      });

      if (data.success) {
        setProfileData(data.profileData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ==========================================
  // NHÓM HÀM XỬ LÝ HỒ SƠ BỆNH ÁN
  // ==========================================

  const getMedicalRecordsByUserId = async (userId) => {
    try {
      const { data } = await axios.get(
        backendUrl + `/api/doctor/medical-records/${userId}`,
        { headers: { dtoken: dToken } },
      );

      if (data.success) {
        setMedicalRecords(data.medicalRecords || []);
        return data.medicalRecords || [];
      }

      toast.error(data.message);
      setMedicalRecords([]);
      return [];
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
      setMedicalRecords([]);
      return [];
    }
  };

  const createMedicalRecord = async (payload) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/create-medical-records",
        payload,
        { headers: { dtoken: dToken } },
      );

      if (data.success) {
        toast.success(data.message);
        return data.medicalRecord;
      }

      toast.error(data.message);
      return null;
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
      return null;
    }
  };

  const updateMedicalRecord = async (medicalRecordId, payload) => {
    try {
      const { data } = await axios.put(
        backendUrl + `/api/doctor/medical-records/${medicalRecordId}`,
        payload,
        { headers: { dtoken: dToken } },
      );

      if (data.success) {
        toast.success(data.message);
        return data.medicalRecord;
      }

      toast.error(data.message);
      return null;
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
      return null;
    }
  };

  // ==========================================
  // NHÓM HÀM XỬ LÝ LỊCH HẸN
  // ==========================================

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/cancel-appointment",
        { appointmentId },
        { headers: { dtoken: dToken } },
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const acceptAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/accept-appointment",
        { appointmentId },
        { headers: { dtoken: dToken } },
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const completeAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/complete-appointment",
        { appointmentId },
        { headers: { dtoken: dToken } },
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const value = {
    dToken,
    setDToken,
    backendUrl,
    appointments,
    getAppointments,
    cancelAppointment,
    acceptAppointment,
    completeAppointment,
    dashData,
    getDashData,
    profileData,
    setProfileData,
    getProfileData,
    medicalRecords,
    setMedicalRecords,
    getMedicalRecordsByUserId,
    createMedicalRecord,
    updateMedicalRecord,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
