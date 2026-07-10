import React, { useState, useMemo } from "react";
import { useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

// ---- small inline icons (no extra dependency) ----
const SearchIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const XIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const SortIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 7h11M3 12h7M3 17h4" />
    <path d="M17 4v16M17 4l-3 3M17 4l3 3" />
  </svg>
);

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "accepted", label: "Đã chấp nhận" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "Tất cả thanh toán" },
  { value: "online", label: "Online" },
  { value: "cash", label: "Tiền mặt" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Ngày mới nhất" },
  { value: "date_asc", label: "Ngày cũ nhất" },
  { value: "name_asc", label: "Tên A → Z" },
  { value: "name_desc", label: "Tên Z → A" },
  { value: "fee_desc", label: "Phí cao → thấp" },
  { value: "fee_asc", label: "Phí thấp → cao" },
];

// slotDate is stored as "D_M_YYYY" in this project — parse it defensively.
const parseSlotDate = (slotDate) => {
  if (!slotDate) return null;
  const parts = slotDate.split("_");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day).getTime();
};

const getStatus = (item) => {
  if (item.cancelled) return "cancelled";
  if (item.isCompleted) return "completed";
  if (item.isAccepted) return "accepted";
  return "pending";
};

const STATUS_BADGE = {
  cancelled: "bg-red-50 text-red-500 ring-1 ring-red-200",
  completed: "bg-green-50 text-green-600 ring-1 ring-green-200",
  accepted: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
  pending: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
};

const STATUS_LABEL = {
  cancelled: "Đã hủy",
  completed: "Đã hoàn thành",
  accepted: "Đã chấp nhận",
  pending: "Chờ xác nhận",
};

const DoctorAppointments = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    cancelAppointment,
    acceptAppointment,
    completeAppointment,
    getMedicalRecordsByUserId,
    createMedicalRecord,
    updateMedicalRecord,
  } = useContext(DoctorContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  const [isCreatingNewRecord, setIsCreatingNewRecord] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [savingMedicalRecord, setSavingMedicalRecord] = useState(false);
  const [draftMedicalRecord, setDraftMedicalRecord] = useState({
    examination: "",
    symptoms: "",
    medicalHistory: "",
    height: "",
    weight: "",
    bmi: "",
    temperature: "",
    heartRate: "",
    systolic: "",
    diastolic: "",
    respiratoryRate: "",
    oxygenSaturation: "",
  });

  // ---- search / filter / sort state ----
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortOption, setSortOption] = useState("date_desc");

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  useEffect(() => {
    if (!dToken) return;

    const intervalId = setInterval(() => {
      getAppointments();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [dToken, getAppointments]);

  const stats = useMemo(() => {
    const counts = {
      all: appointments.length,
      pending: 0,
      accepted: 0,
      completed: 0,
      cancelled: 0,
    };
    appointments.forEach((item) => {
      counts[getStatus(item)] += 1;
    });
    return counts;
  }, [appointments]);

  const visibleAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let list = appointments.filter((item) => {
      const matchesSearch =
        !term || (item.userData?.name || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" || getStatus(item) === statusFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "online" ? item.payment : !item.payment);

      return matchesSearch && matchesStatus && matchesPayment;
    });

    list = [...list].sort((a, b) => {
      switch (sortOption) {
        case "date_asc":
          return (
            (parseSlotDate(a.slotDate) || 0) - (parseSlotDate(b.slotDate) || 0)
          );
        case "date_desc":
          return (
            (parseSlotDate(b.slotDate) || 0) - (parseSlotDate(a.slotDate) || 0)
          );
        case "name_asc":
          return (a.userData?.name || "").localeCompare(b.userData?.name || "");
        case "name_desc":
          return (b.userData?.name || "").localeCompare(a.userData?.name || "");
        case "fee_desc":
          return (b.amount || 0) - (a.amount || 0);
        case "fee_asc":
          return (a.amount || 0) - (b.amount || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [appointments, searchTerm, statusFilter, paymentFilter, sortOption]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    paymentFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setSortOption("date_desc");
  };

  const openMedicalRecordPopup = async (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedMedicalRecord(null);
    setIsCreatingNewRecord(false);
    setMedicalRecords([]);
    setRecordsLoading(true);
    setDraftMedicalRecord({
      examination: "",
      symptoms: "",
      medicalHistory: "",
      height: "",
      weight: "",
      bmi: "",
      temperature: "",
      heartRate: "",
      systolic: "",
      diastolic: "",
      respiratoryRate: "",
      oxygenSaturation: "",
    });

    const records = await getMedicalRecordsByUserId(appointment.userId);
    setMedicalRecords(records);
    setRecordsLoading(false);
  };

  const closeMedicalRecordPopup = () => {
    setSelectedAppointment(null);
    setSelectedMedicalRecord(null);
    setIsCreatingNewRecord(false);
    setMedicalRecords([]);
    setRecordsLoading(false);
    setSavingMedicalRecord(false);
    setDraftMedicalRecord({
      examination: "",
      symptoms: "",
      medicalHistory: "",
      height: "",
      weight: "",
      bmi: "",
      temperature: "",
      heartRate: "",
      systolic: "",
      diastolic: "",
      respiratoryRate: "",
      oxygenSaturation: "",
    });
  };

  const handleDraftFieldChange = (event) => {
    const { name, value } = event.target;
    setDraftMedicalRecord((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const loadMedicalRecordIntoForm = (recordWrapper) => {
    //nếu doctorId = doctorId của appointment thì mới load vào form, nếu không thì không load
    if (
      recordWrapper.medicalRecordId?.doctorId?._id !==
      selectedAppointment?.docData?._id
    ) {
      toast.error(
        "Bạn không thể chỉnh sửa hồ sơ y tế của bác sĩ khác. Vui lòng tạo hồ sơ mới.",
      );
      return;
    }
    const record = recordWrapper.medicalRecordId || {};
    setSelectedMedicalRecord(recordWrapper);
    setIsCreatingNewRecord(false);
    setDraftMedicalRecord({
      examination: record.examination || "",
      symptoms: Array.isArray(record.symptoms)
        ? record.symptoms.join(", ")
        : "",
      medicalHistory: record.medicalHistory || "",
      height: record.vitalSigns?.height ?? "",
      weight: record.vitalSigns?.weight ?? "",
      bmi: record.vitalSigns?.bmi ?? "",
      temperature: record.vitalSigns?.temperature ?? "",
      heartRate: record.vitalSigns?.heartRate ?? "",
      systolic: record.vitalSigns?.bloodPressure?.systolic ?? "",
      diastolic: record.vitalSigns?.bloodPressure?.diastolic ?? "",
      respiratoryRate: record.vitalSigns?.respiratoryRate ?? "",
      oxygenSaturation: record.vitalSigns?.oxygenSaturation ?? "",
    });
  };

  const startNewMedicalRecord = () => {
    setSelectedMedicalRecord(null);
    setIsCreatingNewRecord(true);
    setDraftMedicalRecord({
      examination: "",
      symptoms: "",
      medicalHistory: "",
      height: "",
      weight: "",
      bmi: "",
      temperature: "",
      heartRate: "",
      systolic: "",
      diastolic: "",
      respiratoryRate: "",
      oxygenSaturation: "",
    });
  };

  const handleSaveMedicalRecord = async () => {
    if (!selectedAppointment) return;

    if (!draftMedicalRecord.examination.trim()) {
      toast.error("Vui lòng nhập chẩn đoán trước khi lưu");
      return;
    }

    setSavingMedicalRecord(true);

    const payload = {
      userId: selectedAppointment.userId,
      ...draftMedicalRecord,
    };

    const savedRecord = selectedMedicalRecord
      ? await updateMedicalRecord(
          selectedMedicalRecord.medicalRecordId?._id,
          payload,
        )
      : await createMedicalRecord(payload);

    if (savedRecord) {
      const records = await getMedicalRecordsByUserId(
        selectedAppointment.userId,
      );
      setMedicalRecords(records);
      closeMedicalRecordPopup();
    }

    setSavingMedicalRecord(false);
  };

  // ==== 1. Icon (đặt ở đầu file, ngoài component, viết 1 lần) ====
  const StethoscopeIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 3v6a4 4 0 008 0V3" />
      <path d="M9 15a5 5 0 0010 0v-2" />
      <circle cx="19" cy="10" r="2" />
    </svg>
  );
  const ActivityIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-4l-3 8-4-16-3 8H2" />
    </svg>
  );
  const HistoryIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
  const RulerIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="7" width="18" height="10" rx="1.5" />
      <path d="M7 7v3M11 7v3M15 7v3M19 7v3" />
    </svg>
  );
  const ScaleIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12a4 4 0 018 0" />
      <path d="M12 12v-3" />
    </svg>
  );
  const GaugeIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 14a8 8 0 0116 0" />
      <path d="M12 14l3-4" />
      <circle cx="12" cy="14" r="1" />
    </svg>
  );
  const ThermometerIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 14.76V4a2 2 0 00-4 0v10.76a4 4 0 104 0z" />
    </svg>
  );
  const HeartIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20.8 8.6c0 4-4.4 7.4-8.8 10.7C7.6 16 3.2 12.6 3.2 8.6 3.2 5.5 5.7 3 8.7 3c1.6 0 3.1.8 4.1 2 1-1.2 2.5-2 4.1-2 3 0 5.5 2.5 5.5 5.6z" />
      <path d="M6.5 9h2.5l1.5 3 2-6 1.5 3H16" />
    </svg>
  );
  const WindIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 8h11a2.5 2.5 0 100-5" />
      <path d="M3 16h14a2.5 2.5 0 110 5" />
      <path d="M3 12h8" />
    </svg>
  );
  const DropletIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" />
    </svg>
  );
  const WarningIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    </svg>
  );
  const CheckIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
  const XIcon = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  // ==== 2. Helper thuần (đặt ngoài component, cùng chỗ với icon) ====
  const getBmiStatus = (bmi) => {
    const value = parseFloat(bmi);
    if (Number.isNaN(value)) return null;
    if (value < 18.5)
      return {
        label: "Thiếu cân",
        color: "text-blue-600 bg-blue-50 ring-blue-200",
      };
    if (value < 23)
      return {
        label: "Bình thường",
        color: "text-green-600 bg-green-50 ring-green-200",
      };
    if (value < 25)
      return {
        label: "Thừa cân",
        color: "text-amber-600 bg-amber-50 ring-amber-200",
      };
    return { label: "Béo phì", color: "text-red-600 bg-red-50 ring-red-200" };
  };

  const getVitalWarning = (key, draft) => {
    const num = (value) =>
      value === "" || value === undefined ? null : parseFloat(value);
    switch (key) {
      case "temperature": {
        const t = num(draft.temperature);
        if (t === null || Number.isNaN(t)) return null;
        if (t >= 37.5) return "Sốt (≥ 37.5°C)";
        if (t < 35) return "Hạ thân nhiệt (< 35°C)";
        return null;
      }
      case "heartRate": {
        const hr = num(draft.heartRate);
        if (hr === null || Number.isNaN(hr)) return null;
        if (hr > 100) return "Nhịp tim nhanh (> 100 bpm)";
        if (hr < 60) return "Nhịp tim chậm (< 60 bpm)";
        return null;
      }
      case "bloodPressure": {
        const sys = num(draft.systolic);
        const dia = num(draft.diastolic);
        if (
          sys === null ||
          dia === null ||
          Number.isNaN(sys) ||
          Number.isNaN(dia)
        )
          return null;
        if (sys >= 140 || dia >= 90) return "Huyết áp cao (≥ 140/90)";
        if (sys < 90 || dia < 60) return "Huyết áp thấp (< 90/60)";
        return null;
      }
      case "respiratoryRate": {
        const rr = num(draft.respiratoryRate);
        if (rr === null || Number.isNaN(rr)) return null;
        if (rr > 20) return "Thở nhanh (> 20 lần/phút)";
        if (rr < 12) return "Thở chậm (< 12 lần/phút)";
        return null;
      }
      case "oxygenSaturation": {
        const spo2 = num(draft.oxygenSaturation);
        if (spo2 === null || Number.isNaN(spo2)) return null;
        if (spo2 < 95) return "SpO2 thấp (< 95%)";
        return null;
      }
      default:
        return null;
    }
  };

  // ==== 3. Bên trong component (thêm cạnh các state hiện có) ====
  const [symptomInput, setSymptomInput] = useState("");

  const symptomTags = draftMedicalRecord.symptoms
    ? draftMedicalRecord.symptoms
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const addSymptomTag = () => {
    const value = symptomInput.trim();
    if (!value) return;
    if (symptomTags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      setSymptomInput("");
      return;
    }
    const updatedTags = [...symptomTags, value];
    setDraftMedicalRecord((current) => ({
      ...current,
      symptoms: updatedTags.join(", "),
    }));
    setSymptomInput("");
  };

  const removeSymptomTag = (tagToRemove) => {
    const updatedTags = symptomTags.filter((tag) => tag !== tagToRemove);
    setDraftMedicalRecord((current) => ({
      ...current,
      symptoms: updatedTags.join(", "),
    }));
  };

  const handleSymptomInputKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSymptomTag();
    }
  };

  const calculateBmiFromInputs = () => {
    const heightCm = parseFloat(draftMedicalRecord.height);
    const weightKg = parseFloat(draftMedicalRecord.weight);
    if (!heightCm || !weightKg) {
      toast.error("Nhập chiều cao và cân nặng hợp lệ để tính BMI");
      return;
    }
    const heightM = heightCm / 100;
    const bmi = (weightKg / (heightM * heightM)).toFixed(1);
    setDraftMedicalRecord((current) => ({ ...current, bmi }));
  };

  const VitalField = ({
    icon: Icon,
    label,
    name,
    placeholder,
    warningKey,
    suffix,
  }) => {
    const warning = warningKey
      ? getVitalWarning(warningKey, draftMedicalRecord)
      : null;
    return (
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Icon className="h-3.5 w-3.5 text-gray-400" />
          {label}
        </label>
        <div className="relative">
          <input
            name={name}
            value={draftMedicalRecord[name]}
            onChange={handleDraftFieldChange}
            className={`w-full rounded border bg-white px-3 py-2 text-sm outline-none focus:border-primary ${
              warning ? "border-amber-300" : "border-gray-300"
            } ${suffix ? "pr-10" : ""}`}
            placeholder={placeholder}
            type="text"
            inputMode="decimal"
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {suffix}
            </span>
          )}
        </div>
        {warning && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-600">
            <WarningIcon className="h-3 w-3 shrink-0" />
            {warning}
          </p>
        )}
      </div>
    );
  };

  const bmiStatus = getBmiStatus(draftMedicalRecord.bmi);

  // ==== 4. Hàm chính cần thay thế ====
  const renderMedicalRecordForm = () => (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <StethoscopeIcon className="h-4 w-4 text-primary" />
        {selectedMedicalRecord
          ? `Đang chỉnh sửa hồ sơ y tế cho bác sĩ ${selectedAppointment?.docData?.name}.`
          : `Chưa có hồ sơ y tế. Nhập thông số cho bác sĩ ${selectedAppointment?.docData?.name} tại đây.`}
      </p>

      {/* ---- section: chẩn đoán & triệu chứng ---- */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <StethoscopeIcon className="h-3.5 w-3.5" />
          Chẩn đoán &amp; triệu chứng
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Chẩn đoán / Khám bệnh <span className="text-red-400">*</span>
            </label>
            <input
              name="examination"
              value={draftMedicalRecord.examination}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Nhập nội dung chẩn đoán"
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <ActivityIcon className="h-3.5 w-3.5 text-gray-400" />
              Triệu chứng
            </label>
            <div className="flex flex-wrap items-center gap-1.5 rounded border border-gray-300 bg-white px-2 py-1.5 focus-within:border-primary">
              {symptomTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeSymptomTag(tag)}
                    className="rounded-full hover:bg-primary/20"
                    aria-label={`Xóa triệu chứng ${tag}`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={symptomInput}
                onChange={(event) => setSymptomInput(event.target.value)}
                onKeyDown={handleSymptomInputKeyDown}
                onBlur={addSymptomTag}
                className="min-w-[120px] flex-1 border-none px-1 py-1 text-sm outline-none"
                placeholder={
                  symptomTags.length
                    ? "Thêm triệu chứng..."
                    : "Ví dụ: sốt, ho, đau đầu (Enter để thêm)"
                }
                type="text"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
              <span className="flex items-center gap-1.5">
                <HistoryIcon className="h-3.5 w-3.5 text-gray-400" />
                Tiền sử bệnh
              </span>
              <span className="text-[11px] font-normal text-gray-400">
                {draftMedicalRecord.medicalHistory.length}/500
              </span>
            </label>
            <textarea
              name="medicalHistory"
              value={draftMedicalRecord.medicalHistory}
              onChange={handleDraftFieldChange}
              maxLength={500}
              className="min-h-24 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Nhập tiền sử bệnh"
            />
          </div>
        </div>
      </div>

      {/* ---- section: chỉ số sinh tồn ---- */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <HeartIcon className="h-3.5 w-3.5" />
          Chỉ số sinh tồn
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <VitalField
            icon={RulerIcon}
            label="Chiều cao"
            name="height"
            placeholder="170"
            suffix="cm"
          />
          <VitalField
            icon={ScaleIcon}
            label="Cân nặng"
            name="weight"
            placeholder="65"
            suffix="kg"
          />

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <GaugeIcon className="h-3.5 w-3.5 text-gray-400" />
                BMI
              </label>
              <button
                type="button"
                onClick={calculateBmiFromInputs}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Tính tự động
              </button>
            </div>
            <input
              name="bmi"
              value={draftMedicalRecord.bmi}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="BMI"
              type="text"
              inputMode="decimal"
            />
            {bmiStatus && (
              <p
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${bmiStatus.color}`}
              >
                {bmiStatus.label}
              </p>
            )}
          </div>

          <VitalField
            icon={ThermometerIcon}
            label="Nhiệt độ"
            name="temperature"
            placeholder="37"
            suffix="°C"
            warningKey="temperature"
          />
          <VitalField
            icon={HeartIcon}
            label="Nhịp tim"
            name="heartRate"
            placeholder="75"
            suffix="bpm"
            warningKey="heartRate"
          />

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <ActivityIcon className="h-3.5 w-3.5 text-gray-400" />
              Huyết áp (tâm thu / tâm trương)
            </label>
            <div className="flex items-center gap-2">
              <input
                name="systolic"
                value={draftMedicalRecord.systolic}
                onChange={handleDraftFieldChange}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="120"
                type="text"
                inputMode="decimal"
              />
              <span className="text-gray-400">/</span>
              <input
                name="diastolic"
                value={draftMedicalRecord.diastolic}
                onChange={handleDraftFieldChange}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="80"
                type="text"
                inputMode="decimal"
              />
              <span className="shrink-0 text-xs text-gray-400">mmHg</span>
            </div>
            {getVitalWarning("bloodPressure", draftMedicalRecord) && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-600">
                <WarningIcon className="h-3 w-3 shrink-0" />
                {getVitalWarning("bloodPressure", draftMedicalRecord)}
              </p>
            )}
          </div>

          <VitalField
            icon={WindIcon}
            label="Nhịp thở"
            name="respiratoryRate"
            placeholder="16"
            suffix="/phút"
            warningKey="respiratoryRate"
          />
          <VitalField
            icon={DropletIcon}
            label="SpO2"
            name="oxygenSaturation"
            placeholder="98"
            suffix="%"
            warningKey="oxygenSaturation"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveMedicalRecord}
          disabled={savingMedicalRecord}
          className="flex items-center gap-2 rounded bg-primary px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savingMedicalRecord ? (
            "Đang lưu..."
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Lưu
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-4 text-lg font-medium">Tất cả lịch hẹn</p>

      {/* ---- stats summary ---- */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          {
            key: "all",
            label: "Tổng số",
            value: stats.all,
            color: "text-gray-700 bg-white ring-gray-200",
          },
          {
            key: "pending",
            label: "Chờ xác nhận",
            value: stats.pending,
            color: "text-amber-600 bg-amber-50 ring-amber-200",
          },
          {
            key: "accepted",
            label: "Đã chấp nhận",
            value: stats.accepted,
            color: "text-blue-600 bg-blue-50 ring-blue-200",
          },
          {
            key: "completed",
            label: "Hoàn thành",
            value: stats.completed,
            color: "text-green-600 bg-green-50 ring-green-200",
          },
          {
            key: "cancelled",
            label: "Đã hủy",
            value: stats.cancelled,
            color: "text-red-500 bg-red-50 ring-red-200",
          },
        ].map((card) => (
          <button
            key={card.key}
            onClick={() =>
              setStatusFilter((current) =>
                current === card.key
                  ? "all"
                  : card.key === "all"
                    ? "all"
                    : card.key,
              )
            }
            className={`rounded-xl px-4 py-3 text-left ring-1 transition hover:shadow-sm ${card.color} ${
              statusFilter === card.key && card.key !== "all"
                ? "ring-2 ring-offset-1"
                : ""
            }`}
          >
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="text-xs font-medium opacity-80">{card.label}</p>
          </button>
        ))}
      </div>

      {/* ---- toolbar: search, filters, sort ---- */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên bệnh nhân..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-8 text-sm outline-none focus:border-primary focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Xóa tìm kiếm"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(event) => setPaymentFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {PAYMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="relative">
          <SortIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 hover:border-red-200 hover:text-red-500"
          >
            <XIcon className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      <p className="mb-2 text-xs text-gray-400">
        Hiển thị {visibleAppointments.length} / {appointments.length} lịch hẹn
      </p>

      <div className="bg-white border rounded-xl text-sm max-h-[80vh] overflow-y-scroll shadow-sm">
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b bg-gray-50 font-medium text-gray-600 sticky top-0">
          <p>#</p>
          <p>Bệnh nhân</p>
          <p>Thanh toán</p>
          <p>Tuổi</p>
          <p>Ngày & Giờ</p>
          <p>Phí</p>
          <p>Trạng thái / Thao tác</p>
        </div>

        {visibleAppointments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-gray-400">
            <SearchIcon className="h-8 w-8" />
            <p className="text-sm font-medium text-gray-500">
              Không tìm thấy lịch hẹn phù hợp
            </p>
            <p className="text-xs">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        ) : (
          visibleAppointments.map((item, index) => {
            const status = getStatus(item);
            return (
              <div
                className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50 cursor-pointer transition"
                key={item._id || index}
                onClick={() => openMedicalRecordPopup(item)}
                role="button"
                tabIndex={0}
              >
                <p className="max-sm:hidden">{index + 1}</p>
                <div className="flex items-center gap-2">
                  <img
                    onClick={(event) => event.stopPropagation()}
                    src={item.userData.image}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                    alt=""
                  />
                  <p className="font-medium text-gray-700">
                    {item.userData.name}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-xs inline-block px-2 py-0.5 rounded-full font-medium ${
                      item.payment
                        ? "text-primary ring-1 ring-primary/40 bg-primary/5"
                        : "text-gray-500 ring-1 ring-gray-300"
                    }`}
                  >
                    {item.payment ? "Online" : "Tiền mặt"}
                  </p>
                </div>
                <p className="max-sm:hidden">
                  {calculateAge(item.userData.dob)}
                </p>
                <p>
                  {slotDateFormat(item.slotDate)}, {item.slotTime}
                </p>
                <p className="font-medium text-gray-700">
                  {item.amount}
                  {currency}
                </p>
                {status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        cancelAppointment(item._id);
                      }}
                      className="rounded border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        acceptAppointment(item._id);
                      }}
                      className="rounded bg-primary px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                    >
                      Chấp nhận
                    </button>
                  </div>
                ) : (
                  <p
                    className={`text-xs font-medium px-2 py-1 rounded-full text-center ${STATUS_BADGE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  Medical Record
                </p>
                <p className="text-sm text-gray-500">
                  Bệnh nhân: {selectedAppointment.userData?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {slotDateFormat(selectedAppointment.slotDate)},{" "}
                  {selectedAppointment.slotTime}
                </p>
              </div>
              <button
                onClick={closeMedicalRecordPopup}
                className="rounded-full border px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>

            <div className="px-6 py-5">
              {recordsLoading ? (
                <p className="text-sm text-gray-500">Đang tải hồ sơ...</p>
              ) : medicalRecords.length === 0 || isCreatingNewRecord ? (
                renderMedicalRecordForm()
              ) : (
                <div className="space-y-4">
                  {selectedMedicalRecord && renderMedicalRecordForm()}
                  {medicalRecords
                    .filter(
                      (recordWrapper) =>
                        recordWrapper.medicalRecordId?._id !==
                        selectedMedicalRecord?.medicalRecordId?._id,
                    )
                    .map((recordWrapper, index) => {
                      const record = recordWrapper.medicalRecordId || {};
                      const isActiveRecord =
                        selectedMedicalRecord?.medicalRecordId?._id ===
                        recordWrapper.medicalRecordId?._id;
                      return (
                        <div
                          key={recordWrapper._id || index}
                          className={`rounded-lg border p-4 transition ${
                            isActiveRecord
                              ? "cursor-not-allowed border-primary bg-blue-50 opacity-60"
                              : "cursor-pointer border-gray-200 bg-gray-50 hover:border-primary hover:bg-white"
                          }`}
                          onClick={() => {
                            if (!isActiveRecord) {
                              loadMedicalRecordIntoForm(recordWrapper);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {record.examination || "Khám bệnh"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Bác sĩ: {record.doctorId?.name || "Không rõ"}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {recordWrapper.createdAt
                                ? new Date(
                                    recordWrapper.createdAt,
                                  ).toLocaleString()
                                : ""}
                            </p>
                          </div>

                          <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                            <p>
                              <span className="font-medium text-gray-800">
                                Triệu chứng:
                              </span>{" "}
                              {Array.isArray(record.symptoms) &&
                              record.symptoms.length > 0
                                ? record.symptoms.join(", ")
                                : "Chưa cập nhật"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Tiền sử:
                              </span>{" "}
                              {record.medicalHistory || "Chưa cập nhật"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Chiều cao:
                              </span>{" "}
                              {record.vitalSigns?.height ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Cân nặng:
                              </span>{" "}
                              {record.vitalSigns?.weight ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                BMI:
                              </span>{" "}
                              {record.vitalSigns?.bmi ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Nhiệt độ:
                              </span>{" "}
                              {record.vitalSigns?.temperature ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Nhịp tim:
                              </span>{" "}
                              {record.vitalSigns?.heartRate ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Huyết áp:
                              </span>{" "}
                              {record.vitalSigns?.bloodPressure
                                ? `${record.vitalSigns.bloodPressure.systolic ?? "-"}/${record.vitalSigns.bloodPressure.diastolic ?? "-"}`
                                : "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Nhịp thở:
                              </span>{" "}
                              {record.vitalSigns?.respiratoryRate ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                SpO2:
                              </span>{" "}
                              {record.vitalSigns?.oxygenSaturation ?? "-"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 shadow-sm">
                <div className="flex justify-center">
                  <button
                    onClick={startNewMedicalRecord}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-primary hover:text-primary"
                  >
                    <img src="/plus.svg" alt="" className="h-4 w-4" />
                    <span>Thêm hồ sơ mới</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
