import { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

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
