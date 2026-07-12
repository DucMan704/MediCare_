import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import {
  Pencil,
  Save,
  Mail,
  Phone,
  MapPin,
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
  FileText,
  CalendarClock,
  Loader2,
  ClipboardX,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Classify a vital sign reading so the UI can flag anything outside
// a normal adult range without making a diagnosis — just a visual cue.
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

/* A single vital-sign tile: icon, value, unit, and a status pill. */
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
/* Component                                                            */
/* ------------------------------------------------------------------ */

const MyProfile = () => {
  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(false);

  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const { token, backendUrl, userData, setUserData, loadUserProfileData } =
    useContext(AppContext);

  const getMedicalRecords = async () => {
    try {
      setLoadingRecords(true);

      // B1: Lấy dữ liệu hồ sơ bệnh án từ backend
      const { data } = await axios.get(
        backendUrl + `/api/user/medical-records/${userData._id}`,
        { headers: { token } },
      );

      if (data.success) {
        // B2: Lưu dữ liệu hồ sơ bệnh án vào state
        setMedicalRecords(data.medicalRecords);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoadingRecords(false);
    }
  };

  // B3: Hiển thị dữ liệu hồ sơ bệnh án trong component — gọi API khi đã có userId
  useEffect(() => {
    if (userData?._id && token) {
      getMedicalRecords();
    }
  }, [userData?._id, token]);

  const updateUserProfileData = async () => {
    try {
      const formData = new FormData();

      formData.append("name", userData.name);
      formData.append("phone", userData.phone);
      formData.append("address", JSON.stringify(userData.address));
      formData.append("gender", userData.gender);
      formData.append("dob", userData.dob);

      image && formData.append("image", image);

      const { data } = await axios.post(
        backendUrl + "/api/user/update-profile",
        formData,
        { headers: { token } },
      );

      if (data.success) {
        toast.success(data.message);
        await loadUserProfileData();
        setIsEdit(false);
        setImage(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  if (!userData) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-16 pt-6">
      {/* ---------------------------------------------------------- */}
      {/* Profile card                                                */}
      {/* ---------------------------------------------------------- */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="h-20 bg-gradient-to-r from-primary/90 to-primary/60" />

        <div className="-mt-12 flex flex-col gap-5 px-6 pb-6 sm:px-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {isEdit ? (
                <label htmlFor="image" className="cursor-pointer">
                  <div className="relative inline-block">
                    <img
                      className="h-28 w-28 rounded-2xl border-4 border-white object-cover opacity-90 shadow-md"
                      src={image ? URL.createObjectURL(image) : userData.image}
                      alt=""
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
                      <img className="w-8" src={assets.upload_icon} alt="" />
                    </div>
                  </div>
                  <input
                    onChange={(e) => setImage(e.target.files[0])}
                    type="file"
                    id="image"
                    hidden
                  />
                </label>
              ) : (
                <img
                  className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-md"
                  src={userData.image}
                  alt=""
                />
              )}

              <div className="pb-1">
                {isEdit ? (
                  <input
                    className="w-52 border-b border-gray-300 bg-transparent pb-1 text-2xl font-semibold text-[#262626] focus:border-primary focus:outline-none"
                    type="text"
                    onChange={(e) =>
                      setUserData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    value={userData.name}
                  />
                ) : (
                  <p className="text-2xl font-semibold text-[#262626]">
                    {userData.name}
                  </p>
                )}
                <p className="text-sm text-gray-400">Hồ sơ bệnh nhân</p>
              </div>
            </div>

            <button
              onClick={isEdit ? updateUserProfileData : () => setIsEdit(true)}
              className="flex items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-white"
            >
              {isEdit ? <Save size={16} /> : <Pencil size={16} />}
              {isEdit ? "Lưu thông tin" : "Chỉnh sửa"}
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Contact info */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Thông tin liên hệ
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-[#363636]">{userData.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Điện thoại</p>
                  {isEdit ? (
                    <input
                      className="w-full border-b border-gray-300 bg-transparent text-sm focus:border-primary focus:outline-none"
                      type="text"
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      value={userData.phone}
                    />
                  ) : (
                    <p className="text-sm text-[#363636]">{userData.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin size={18} className="mt-0.5 text-primary" />
                <div className="w-full">
                  <p className="text-xs text-gray-400">Địa chỉ</p>
                  {isEdit ? (
                    <div className="flex flex-col gap-1">
                      <input
                        className="w-full border-b border-gray-300 bg-transparent text-sm focus:border-primary focus:outline-none"
                        type="text"
                        onChange={(e) =>
                          setUserData((prev) => ({
                            ...prev,
                            address: { ...prev.address, line1: e.target.value },
                          }))
                        }
                        value={userData.address.line1}
                      />
                      <input
                        className="w-full border-b border-gray-300 bg-transparent text-sm focus:border-primary focus:outline-none"
                        type="text"
                        onChange={(e) =>
                          setUserData((prev) => ({
                            ...prev,
                            address: { ...prev.address, line2: e.target.value },
                          }))
                        }
                        value={userData.address.line2}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-[#363636]">
                      {userData.address.line1}
                      <br />
                      {userData.address.line2}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Basic info */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Thông tin cơ bản
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <VenusAndMars size={18} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Giới tính</p>
                  {isEdit ? (
                    <select
                      className="border-b border-gray-300 bg-transparent text-sm focus:border-primary focus:outline-none"
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          gender: e.target.value,
                        }))
                      }
                      value={userData.gender}
                    >
                      <option value="Not Selected">Chưa chọn</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                    </select>
                  ) : (
                    <p className="text-sm text-[#363636]">
                      {userData.gender === "Male"
                        ? "Nam"
                        : userData.gender === "Female"
                          ? "Nữ"
                          : userData.gender === "Not Selected"
                            ? "Chưa chọn"
                            : userData.gender}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Cake size={18} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Ngày sinh</p>
                  {isEdit ? (
                    <input
                      className="border-b border-gray-300 bg-transparent text-sm focus:border-primary focus:outline-none"
                      type="date"
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          dob: e.target.value,
                        }))
                      }
                      value={userData.dob}
                    />
                  ) : (
                    <p className="text-sm text-[#363636]">{userData.dob}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Medical records                                             */}
      {/* ---------------------------------------------------------- */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <FileText size={14} />
          Hồ sơ bệnh án
        </p>

        {loadingRecords ? (
          <div className="flex items-center justify-center gap-2 rounded-3xl border border-gray-100 bg-white py-14 text-sm text-gray-400 shadow-sm">
            <Loader2 size={16} className="animate-spin" />
            Đang tải hồ sơ bệnh án...
          </div>
        ) : medicalRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-gray-200 bg-white py-14 text-center text-sm text-gray-400">
            <ClipboardX size={22} className="text-gray-300" />
            Chưa có hồ sơ bệnh án nào
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {medicalRecords.map((item) => {
              const record = item.medicalRecordId ?? {};
              const doctor = record.doctorId ?? {};
              const vs = record.vitalSigns ?? {};
              const bp = vs.bloodPressure ?? {};

              return (
                <div
                  key={item._id}
                  className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-5 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Stethoscope size={20} />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-[#262626]">
                            {record.examination}
                          </p>
                          <p className="text-xs text-gray-400">
                            Mã hồ sơ: {record._id?.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <CalendarClock size={14} />
                        Cập nhật {formatDateTime(record.updatedAt)}
                      </div>
                    </div>

                    {doctor.name && (
                      <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-gray-100">
                        {doctor.image && (
                          <img
                            src={doctor.image}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#262626]">
                            {doctor.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {doctor.speciality}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
                    {/* Symptoms */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Triệu chứng
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(record.symptoms ?? []).map((symptom, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 ring-1 ring-rose-100"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Vital signs */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Chỉ số sinh tồn
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                          status={rangeStatus(vs.temperature, 36.1, 37.5)}
                        />
                        <VitalTile
                          icon={HeartPulse}
                          label="Nhịp tim"
                          value={vs.heartRate}
                          unit="bpm"
                          status={rangeStatus(vs.heartRate, 60, 100)}
                        />
                        <VitalTile
                          icon={Activity}
                          label="Huyết áp"
                          value={
                            bp.systolic != null
                              ? `${bp.systolic}/${bp.diastolic}`
                              : "—"
                          }
                          unit="mmHg"
                          status={rangeStatus(bp.diastolic, 60, 89)}
                        />
                        <VitalTile
                          icon={Wind}
                          label="Nhịp thở"
                          value={vs.respiratoryRate}
                          unit="lần/phút"
                          status={rangeStatus(vs.respiratoryRate, 12, 20)}
                        />
                        <VitalTile
                          icon={Gauge}
                          label="SpO2"
                          value={vs.oxygenSaturation}
                          unit="%"
                          status={rangeStatus(vs.oxygenSaturation, 95, 100)}
                        />
                      </div>
                    </div>

                    {/* Medical history */}
                    {record.medicalHistory && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Tiền sử bệnh
                        </p>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600 ring-1 ring-gray-100">
                          {record.medicalHistory}
                        </div>
                      </div>
                    )}

                    <p className="text-right text-xs text-gray-300">
                      Tạo lúc {formatDateTime(record.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
