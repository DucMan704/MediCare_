import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import {
  Search,
  ArrowUpDown,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  SlidersHorizontal,
  FileText,
  Pencil,
  Save,
  VenusAndMars,
  Cake,
  Stethoscope,
  Activity,
  Thermometer,
  HeartPulse,
  Wind,
  Ruler,
  Weight,
  Gauge,
  CalendarClock,
  Loader2,
  ClipboardX,
  Trash2,
  CalendarDays,
  ShieldAlert,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* VITAL SIGN HELPERS                                                 */
/* ------------------------------------------------------------------ */
const rangeStatus = (value, low, high) => {
  if (value == null || Number.isNaN(value)) return "unknown";
  if (value < low || value > high) return "critical";
  return "normal";
};

const statusStyles = {
  normal: {
    ring: "ring-emerald-100",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Bình thường",
  },
  critical: {
    ring: "ring-rose-100",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    label: "Bất thường",
  },
  unknown: {
    ring: "ring-gray-100",
    bg: "bg-gray-50",
    text: "text-gray-500",
    dot: "bg-gray-300",
    label: "—",
  },
};

const formatDateTime = (iso) => {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const VitalTile = ({ icon: Icon, label, value, unit, status }) => {
  const s = statusStyles[status] ?? statusStyles.unknown;
  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border border-gray-100 ${s.bg} p-4 ring-1 ${s.ring} transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-sm">
          <Icon size={18} strokeWidth={2} />
        </div>
        <span
          className={`flex items-center gap-1 text-[11px] font-medium ${s.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-[#262626]">
          {value}
          {unit && (
            <span className="ml-1 text-xs font-normal text-gray-400">
              {unit}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */
const PatientsList = () => {
  const { aToken, backendUrl } = useContext(AdminContext);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc danh sách gốc
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");

  // State Quản lý dữ liệu Độc lập của Modal 1: XEM & SỬA HỒ SƠ BỆNH ÁN
  const [profileModal, setProfileModal] = useState({
    isOpen: false,
    isEdit: false,
    loadingRecords: false,
    patientData: null,
    medicalRecords: [],
    uploadedImage: null,
  });

  // State Quản lý dữ liệu Độc lập của Modal 2: XEM LỊCH SỬ ĐẶT LỊCH HẸN
  const [appointmentModal, setAppointmentModal] = useState({
    isOpen: false,
    loading: false,
    patientName: "",
    appointments: [],
  });

  const getAllPatients = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/patients`, {
        headers: { aToken },
      });
      if (data.success) {
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aToken) {
      getAllPatients();
    }
  }, [aToken]);

  // --- HÀM 1: MỞ HỒ SƠ CHI TIẾT & BỆNH ÁN ---
  const openPatientProfile = async (patient) => {
    setProfileModal({
      isOpen: true,
      isEdit: false,
      loadingRecords: true,
      patientData: { ...patient },
      medicalRecords: [],
      uploadedImage: null,
    });

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/admin/medical-records/${patient._id}`,
        {
          headers: { aToken }, // Gửi aToken khớp với middleware authAdmin
        },
      );
      if (data.success) {
        setProfileModal((prev) => ({
          ...prev,
          loadingRecords: false,
          medicalRecords: data.medicalRecords || [],
        }));
      } else {
        toast.error(data.message);
        setProfileModal((prev) => ({ ...prev, loadingRecords: false }));
      }
    } catch (error) {
      console.error(error);
      setProfileModal((prev) => ({ ...prev, loadingRecords: false }));
    }
  };

  // --- HÀM 2: CẬP NHẬT THÔNG TIN HỒ SƠ TỪ PHÍA ADMIN ---
  const handleUpdatePatientProfile = async () => {
    try {
      const p = profileModal.patientData;
      const formData = new FormData();

      formData.append("userId", p._id);
      formData.append("name", p.name);
      formData.append("phone", p.phone);
      formData.append("address", JSON.stringify(p.address));
      formData.append("gender", p.gender);
      formData.append("dob", p.dob);

      if (profileModal.uploadedImage) {
        formData.append("image", profileModal.uploadedImage);
      }

      const { data } = await axios.post(
        `${backendUrl}/api/admin/update-patient-profile`,
        formData,
        {
          headers: { aToken },
        },
      );

      if (data.success) {
        toast.success(data.message);
        setProfileModal((prev) => ({
          ...prev,
          isEdit: false,
          uploadedImage: null,
        }));
        await getAllPatients();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // --- HÀM 3: MỞ XEM DANH SÁCH LỊCH HẸN ---
  const openPatientAppointments = async (patientName, userId) => {
    setAppointmentModal({
      isOpen: true,
      loading: true,
      patientName: patientName,
      appointments: [],
    });

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/admin/patient-appointments/${userId}`,
        {
          headers: { aToken },
        },
      );
      if (data.success) {
        setAppointmentModal({
          isOpen: true,
          loading: false,
          patientName: patientName,
          appointments: data.appointments || [],
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải lịch sử lịch hẹn");
      setAppointmentModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // --- HÀM 4: XÓA BỆNH NHÂN KHỎI HỆ THỐNG ---
  const handleDeletePatient = async (userId, patientName) => {
    const confirmDelete = window.confirm(
      `CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản bệnh nhân "${patientName}"? Tất cả dữ liệu liên quan sẽ bị loại bỏ hoàn toàn.`,
    );
    if (!confirmDelete) return;

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/delete-patient`,
        { userId },
        {
          headers: { aToken },
        },
      );
      if (data.success) {
        toast.success(data.message);
        await getAllPatients();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa bệnh nhân");
    }
  };

  // --- XỬ LÝ LỌC DỮ LIỆU BẢNG ---
  const processedPatients = [...patients]
    .filter(
      (p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm),
    )
    .filter((p) => genderFilter === "All" || p.gender === genderFilter)
    .sort((a, b) => {
      if (sortBy === "name-asc") return a.name?.localeCompare(b.name || "");
      if (sortBy === "name-desc") return b.name?.localeCompare(a.name || "");
      return 0;
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">
          Đang đồng bộ danh sách bệnh nhân...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-5 md:p-8 overflow-y-auto pb-10 relative custom-scrollbar">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Hồ sơ Bệnh nhân Hệ thống
          <span className="bg-primary/10 text-primary text-sm py-1 px-3 rounded-full font-bold">
            {processedPatients.length}
          </span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Tra cứu dữ liệu liên hệ, quản lý hồ sơ bệnh án điện tử và điều phối
          thông tin khách hàng toàn diện.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo họ tên, email hoặc số điện thoại liên lạc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SlidersHorizontal size={16} className="text-gray-400" />
            </div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm appearance-none bg-white cursor-pointer"
            >
              <option value="All">Tất cả giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDown size={16} className="text-gray-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm appearance-none bg-white cursor-pointer"
            >
              <option value="name-asc">Họ tên (A - Z)</option>
              <option value="name-desc">Họ tên (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* PATIENTS TABLE */}
      {processedPatients.length > 0 ? (
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm font-semibold">
                  <th className="py-4 px-6">Bệnh nhân</th>
                  <th className="py-4 px-6">Thông tin liên hệ</th>
                  <th className="py-4 px-6">Thông số cơ bản</th>
                  <th className="py-4 px-6 text-center">Hành động xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {processedPatients.map((patient) => (
                  <tr
                    key={patient._id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                          src={patient.image || assets.patient_icon}
                          alt={patient.name}
                        />
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {patient.name}
                          </p>
                          <span
                            className={`inline-block px-2 py-0.5 mt-0.5 rounded text-xs font-semibold ${patient.gender === "Male" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}
                          >
                            {patient.gender === "Male"
                              ? "Nam"
                              : patient.gender === "Female"
                                ? "Nữ"
                                : "Chưa chọn"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                          <Mail size={14} className="text-gray-400" />{" "}
                          {patient.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone size={14} className="text-gray-400" />{" "}
                          {patient.phone || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" /> Sinh
                          nhật: {patient.dob || "—"}
                        </span>
                        <span className="flex items-center gap-1.5 truncate max-w-xs">
                          <MapPin size={14} className="text-gray-400" />{" "}
                          {patient.address?.line1 || "Chưa cập nhật"}
                        </span>
                      </div>
                    </td>

                    {/* KHỐI 3 HÀNH ĐỘNG RIÊNG BIỆT */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openPatientProfile(patient)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all border border-blue-100"
                          title="Xem thông tin chi tiết và cập nhật bệnh án"
                        >
                          <Eye size={13} />
                          Hồ sơ & Sửa
                        </button>

                        <button
                          onClick={() =>
                            openPatientAppointments(patient.name, patient._id)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all border border-indigo-100"
                          title="Tra cứu danh sách lịch hẹn khám"
                        >
                          <CalendarDays size={13} />
                          Lịch hẹn
                        </button>

                        <button
                          onClick={() =>
                            handleDeletePatient(patient._id, patient.name)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all border border-rose-100"
                          title="Xóa bệnh nhân vĩnh viễn"
                        >
                          <Trash2 size={13} />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <User size={32} className="text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-700">
            Không tìm thấy bệnh nhân nào khớp bộ lọc
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CHI TIẾT HỒ SƠ + EDIT TÀI KHOẢN + BỆNH ÁN DETAILED                */}
      {/* ========================================================================= */}
      {profileModal.isOpen && profileModal.patientData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-50 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  Thông tin bệnh án & Sửa hồ sơ
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Mã tài khoản: {profileModal.patientData._id}
                </p>
              </div>
              <button
                onClick={() =>
                  setProfileModal((prev) => ({
                    ...prev,
                    isOpen: false,
                    isEdit: false,
                  }))
                }
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* PROFILE CARD & EDIT FORM */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="h-16 bg-gradient-to-r from-primary/80 to-primary/50" />
                <div className="-mt-10 flex flex-col gap-5 px-6 pb-6 sm:px-8">
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-end gap-4">
                      {profileModal.isEdit ? (
                        <label htmlFor="modal-image" className="cursor-pointer">
                          <div className="relative inline-block">
                            <img
                              className="h-24 w-24 rounded-xl border-4 border-white object-cover opacity-90 shadow-md"
                              src={
                                profileModal.uploadedImage
                                  ? URL.createObjectURL(
                                      profileModal.uploadedImage,
                                    )
                                  : profileModal.patientData.image
                              }
                              alt=""
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
                              <img
                                className="w-6"
                                src={assets.upload_icon}
                                alt=""
                              />
                            </div>
                          </div>
                          <input
                            type="file"
                            id="modal-image"
                            hidden
                            onChange={(e) =>
                              setProfileModal((prev) => ({
                                ...prev,
                                uploadedImage: e.target.files[0],
                              }))
                            }
                          />
                        </label>
                      ) : (
                        <img
                          className="h-24 w-24 rounded-xl border-4 border-white object-cover shadow-md"
                          src={profileModal.patientData.image}
                          alt=""
                        />
                      )}

                      <div className="pb-1">
                        {profileModal.isEdit ? (
                          <input
                            className="w-48 border-b border-gray-300 bg-transparent pb-1 text-xl font-semibold text-[#262626] focus:border-primary focus:outline-none"
                            type="text"
                            value={profileModal.patientData.name}
                            onChange={(e) =>
                              setProfileModal((prev) => ({
                                ...prev,
                                patientData: {
                                  ...prev.patientData,
                                  name: e.target.value,
                                },
                              }))
                            }
                          />
                        ) : (
                          <p className="text-xl font-semibold text-[#262626]">
                            {profileModal.patientData.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">Hồ sơ bệnh nhân</p>
                      </div>
                    </div>

                    <button
                      onClick={
                        profileModal.isEdit
                          ? handleUpdatePatientProfile
                          : () =>
                              setProfileModal((prev) => ({
                                ...prev,
                                isEdit: true,
                              }))
                      }
                      className="flex items-center gap-2 rounded-full border border-primary px-4 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary hover:text-white"
                    >
                      {profileModal.isEdit ? (
                        <Save size={14} />
                      ) : (
                        <Pencil size={14} />
                      )}
                      {profileModal.isEdit ? "Lưu thay đổi" : "Sửa hồ sơ"}
                    </button>
                  </div>

                  <hr className="border-gray-100" />
                  {/* LIÊN HỆ */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div>
                      <p className="text-gray-400 font-medium">Email</p>
                      <p className="text-[#363636] font-semibold mt-0.5">
                        {profileModal.patientData.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Điện thoại</p>
                      {profileModal.isEdit ? (
                        <input
                          className="border-b border-gray-300 bg-transparent py-0.5 focus:border-primary focus:outline-none w-full font-semibold"
                          type="text"
                          value={profileModal.patientData.phone}
                          onChange={(e) =>
                            setProfileModal((prev) => ({
                              ...prev,
                              patientData: {
                                ...prev.patientData,
                                phone: e.target.value,
                              },
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[#363636] font-semibold mt-0.5">
                          {profileModal.patientData.phone || "—"}
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-400 font-medium">Địa chỉ</p>
                      {profileModal.isEdit ? (
                        <input
                          className="border-b border-gray-300 bg-transparent py-0.5 focus:border-primary focus:outline-none w-full font-semibold"
                          type="text"
                          value={profileModal.patientData.address?.line1 || ""}
                          onChange={(e) =>
                            setProfileModal((prev) => ({
                              ...prev,
                              patientData: {
                                ...prev.patientData,
                                address: {
                                  ...prev.patientData.address,
                                  line1: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[#363636] font-semibold mt-0.5">
                          {profileModal.patientData.address?.line1 ||
                            "Chưa cập nhật"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Giới tính</p>
                      {profileModal.isEdit ? (
                        <select
                          className="border-b border-gray-300 bg-transparent py-0.5 focus:border-primary focus:outline-none font-semibold"
                          value={profileModal.patientData.gender}
                          onChange={(e) =>
                            setProfileModal((prev) => ({
                              ...prev,
                              patientData: {
                                ...prev.patientData,
                                gender: e.target.value,
                              },
                            }))
                          }
                        >
                          <option value="Male">Nam</option>
                          <option value="Female">Nữ</option>
                        </select>
                      ) : (
                        <p className="text-[#363636] font-semibold mt-0.5">
                          {profileModal.patientData.gender === "Male"
                            ? "Nam"
                            : "Nữ"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Ngày sinh</p>
                      {profileModal.isEdit ? (
                        <input
                          className="border-b border-gray-300 bg-transparent py-0.5 focus:border-primary focus:outline-none font-semibold w-full"
                          type="date"
                          // Nếu dob là "Not Selected" hoặc null, ta ép về chuỗi trống "" để input date không bị lỗi format
                          value={
                            profileModal.patientData.dob === "Not Selected" ||
                            !profileModal.patientData.dob
                              ? ""
                              : profileModal.patientData.dob
                          }
                          onChange={(e) =>
                            setProfileModal((prev) => ({
                              ...prev,
                              patientData: {
                                ...prev.patientData,
                                dob: e.target.value,
                              },
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[#363636] font-semibold mt-0.5">
                          {profileModal.patientData.dob || "—"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* HỒ SƠ BỆNH ÁN ĐIỆN TỬ */}
              <div>
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <FileText size={14} /> Hồ sơ bệnh án điện tử
                </p>
                {profileModal.loadingRecords ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-10 text-sm text-gray-400 shadow-sm">
                    <Loader2 size={16} className="animate-spin" /> Đang tải lịch
                    sử...
                  </div>
                ) : profileModal.medicalRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center text-xs text-gray-400">
                    <ClipboardX size={22} className="text-gray-300" /> Bệnh nhân
                    này chưa có dữ liệu bệnh án
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileModal.medicalRecords.map((item) => {
                      const record = item.medicalRecordId ?? {};
                      const doctor = record.doctorId ?? {};
                      const vs = record.vitalSigns ?? {};
                      const bp = vs.bloodPressure ?? {};
                      return (
                        <div
                          key={item._id}
                          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                        >
                          <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-bold text-gray-800">
                                {record.examination}
                              </p>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <CalendarClock size={12} /> Cập nhật{" "}
                                {formatDateTime(record.updatedAt)}
                              </span>
                            </div>
                            {doctor.name && (
                              <p className="text-xs text-gray-500 font-medium">
                                Bác sĩ phụ trách: BS. {doctor.name} (
                                {doctor.speciality})
                              </p>
                            )}
                          </div>
                          <div className="p-4 space-y-3 text-xs">
                            <div>
                              <p className="text-gray-400 font-semibold mb-1">
                                Triệu chứng
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {(record.symptoms ?? []).map((sym, i) => (
                                  <span
                                    key={i}
                                    className="rounded bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600 ring-1 ring-rose-100"
                                  >
                                    {sym}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-400 font-semibold mb-1">
                                Chỉ số sinh tồn
                              </p>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <VitalTile
                                  icon={Ruler}
                                  label="Chiều cao"
                                  value={vs.height}
                                  unit="cm"
                                  status="normal"
                                />
                                <VitalTile
                                  icon={Weight}
                                  label="Cân nặng"
                                  value={vs.weight}
                                  unit="kg"
                                  status="normal"
                                />
                                <VitalTile
                                  icon={Gauge}
                                  label="BMI"
                                  value={vs.bmi}
                                  status={rangeStatus(vs.bmi, 18.5, 24.9)}
                                />
                                <VitalTile
                                  icon={Thermometer}
                                  label="Nhiệt độ"
                                  value={vs.temperature}
                                  unit="°C"
                                  status={rangeStatus(
                                    vs.temperature,
                                    36.1,
                                    37.5,
                                  )}
                                />
                              </div>
                            </div>
                            {record.medicalHistory && (
                              <div>
                                <p className="text-gray-400 font-semibold mb-0.5">
                                  Tiền sử bệnh án
                                </p>
                                <p className="bg-slate-50 p-2 rounded text-gray-600 italic">
                                  "{record.medicalHistory}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end bg-white">
              <button
                onClick={() =>
                  setProfileModal((prev) => ({
                    ...prev,
                    isOpen: false,
                    isEdit: false,
                  }))
                }
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: XEM DANH SÁCH LỊCH HẸN KHÁM CỦA BỆNH NHÂN                         */}
      {/* ========================================================================= */}
      {appointmentModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  Lịch sử lịch hẹn khám
                </h3>
                <p className="text-xs text-primary font-medium mt-0.5">
                  Bệnh nhân: {appointmentModal.patientName}
                </p>
              </div>
              <button
                onClick={() =>
                  setAppointmentModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 min-h-[250px]">
              {appointmentModal.loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-xs font-medium">
                    Đang tìm kiếm danh sách lịch hẹn...
                  </p>
                </div>
              ) : appointmentModal.appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointmentModal.appointments.map((app, index) => (
                    <div
                      key={app._id || index}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-800 text-sm">
                          BS. {app.docData?.name}
                        </p>
                        <p className="text-primary font-medium mt-0.5">
                          {app.docData?.speciality}
                        </p>
                        <div className="flex gap-3 text-gray-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {app.slotTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />{" "}
                            {app.slotDate?.replaceAll("_", "/")}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {app.cancelled ? (
                          <span className="px-2.5 py-1 rounded-full font-bold bg-rose-50 text-rose-600 flex items-center gap-1">
                            <XCircle size={12} /> Đã hủy
                          </span>
                        ) : app.isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Xong
                          </span>
                        ) : app.payment ? (
                          <span className="px-2.5 py-1 rounded-full font-bold bg-indigo-50 text-indigo-600 flex items-center gap-1">
                            <FileText size={12} /> Đã trả phí
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-600 flex items-center gap-1">
                            <ShieldAlert size={12} /> Chờ khám
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <CalendarDays size={40} className="mb-2 text-gray-300" />
                  <p className="font-bold text-gray-500">Chưa từng đặt lịch</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() =>
                  setAppointmentModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="px-5 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsList;
