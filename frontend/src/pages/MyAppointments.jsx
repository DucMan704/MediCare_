import React, { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { formatSlotDate, translateSpeciality } from "../utils/i18n";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  MapPin,
  Clock,
  Inbox,
  X,
  CalendarCheck,
  PlusCircle,
  PhoneCall,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const parseSlotDate = (slotDate) => {
  if (!slotDate) return null;
  const [day, month, year] = slotDate.split("_").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

const getAppointmentStatus = (item) => {
  if (item.cancelled) return "cancelled";
  if (item.isCompleted) return "completed";
  if (item.payment) return "paid";
  if (item.isAccepted) return "accepted";
  return "pending";
};

const STATUS_META = {
  pending: {
    label: "Chờ xác nhận",
    badge: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
  },
  accepted: {
    label: "Chờ thanh toán",
    badge: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
  },
  paid: {
    label: "Đã thanh toán",
    badge: "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100",
  },
  completed: {
    label: "Hoàn thành",
    badge: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
  },
  cancelled: {
    label: "Đã hủy",
    badge: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
  },
};

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "accepted", label: "Chờ thanh toán" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Ngày khám: Mới nhất" },
  { value: "date_asc", label: "Ngày khám: Cũ nhất" },
  { value: "name_asc", label: "Tên bác sĩ: A → Z" },
  { value: "name_desc", label: "Tên bác sĩ: Z → A" },
];

const MyAppointments = () => {
  const { backendUrl, token } = useContext(AppContext);

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();
  const currencySymbol = import.meta.env.VITE_CURRENCY?.trim() || "đ";
  const isRazorpayConfigured =
    razorpayKeyId && !razorpayKeyId.includes("Razorpay Key Id here");

  const [appointments, setAppointments] = useState([]);
  const [payment, setPayment] = useState("");
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [stripeAppointmentId, setStripeAppointmentId] = useState("");
  const [stripeForm, setStripeForm] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("date_desc");
  // State quản lý lịch hẹn đang chọn để xem hóa đơn
  const [selectedInvoiceAppointment, setSelectedInvoiceAppointment] =
    useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const selectedStripeAppointment = appointments.find(
    (appointment) => appointment._id === stripeAppointmentId,
  );

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/appointments", {
        headers: { token },
      });
      setAppointments(data.appointments.reverse());
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/cancel-appointment",
        { appointmentId },
        { headers: { token } },
      );

      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // ==========================================
  // XỬ LÝ THANH TOÁN VNPAY HỢP NHẤT
  // ==========================================
  const appointmentVNPay = async (appointmentId) => {
    try {
      // Sửa đường dẫn từ /api/payment/vnpay thành /api/user/create-vnpay-qr
      const { data } = await axios.post(
        `${backendUrl}/api/user/create-vnpay-qr`,
        { appointmentId },
        { headers: { token } },
      );

      if (data.success && data.paymentUrl) {
        // Chuyển hướng người dùng sang trang thanh toán bảo mật của VNPay
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.message || "Không thể tạo liên kết thanh toán VNPay");
      }
    } catch (error) {
      console.error("VNPay Frontend Error:", error);
      toast.error(
        error.response?.data?.message || "Lỗi kết nối cổng thanh toán",
      );
    }
  };

  // ==========================================
  // HÀM KHÁC (RAZORPAY & STRIPE GIỮ NGUYÊN)
  // ==========================================
  const initPay = (order) => {
    if (!isRazorpayConfigured) {
      toast.error("Razorpay is not configured");
      return;
    }
    const options = {
      key: razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: "Thanh toán lịch khám",
      description: "Thanh toán lịch khám",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(
            backendUrl + "/api/user/verifyRazorpay",
            response,
            { headers: { token } },
          );
          if (data.success) {
            getUserAppointments();
          }
        } catch (error) {
          toast.error(error.message);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/payment-razorpay",
        { appointmentId },
        { headers: { token } },
      );
      if (data.success) {
        initPay(data.order);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openStripeModal = (appointmentId) => {
    setStripeAppointmentId(appointmentId);
    setStripeForm({
      cardholderName: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
    });
    setStripeModalOpen(true);
  };

  const closeStripeModal = () => {
    setStripeModalOpen(false);
    setStripeAppointmentId("");
  };

  const handleStripeFieldChange = (event) => {
    const { name, value } = event.target;
    setStripeForm((current) => ({ ...current, [name]: value }));
  };

  const appointmentStripe = (appointmentId) => {
    openStripeModal(appointmentId);
  };

  const confirmStripePayment = async (event) => {
    event.preventDefault();
    if (
      !stripeForm.cardholderName.trim() ||
      !stripeForm.cardNumber.trim() ||
      !stripeForm.expiryMonth.trim() ||
      !stripeForm.expiryYear.trim()
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin thanh toán");
      return;
    }

    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/verifyStripe",
        { appointmentId: stripeAppointmentId, success: "true" },
        { headers: { token } },
      );
      if (data.success) {
        toast.success(data.message || "Payment Successful");
        closeStripeModal();
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token]);

  const visibleAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = appointments.filter((item) => {
      const matchesSearch =
        !term ||
        item.docData.name.toLowerCase().includes(term) ||
        item.docData.speciality.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" || getAppointmentStatus(item) === statusFilter;
      return matchesSearch && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sortOrder === "name_asc")
        return a.docData.name.localeCompare(b.docData.name);
      if (sortOrder === "name_desc")
        return b.docData.name.localeCompare(b.docData.name);
      const dateA = parseSlotDate(a.slotDate);
      const dateB = parseSlotDate(b.slotDate);
      if (!dateA || !dateB) return 0;
      return sortOrder === "date_asc" ? dateA - dateB : dateB - dateA;
    });
    return list;
  }, [appointments, searchTerm, statusFilter, sortOrder]);

  const hasActiveFilters = searchTerm.trim() !== "" || statusFilter !== "all";

  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      accepted: 0,
      paid: 0,
      completed: 0,
      cancelled: 0,
    };
    appointments.forEach((item) => {
      counts[getAppointmentStatus(item)] += 1;
    });
    return counts;
  }, [appointments]);

  const nearestAppointment = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments
      .filter((item) => !item.cancelled && !item.isCompleted)
      .map((item) => ({ item, date: parseSlotDate(item.slotDate) }))
      .filter(({ date }) => date && date >= today)
      .sort((a, b) => a.date - b.date)[0]?.item;
  }, [appointments]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 lg:grid lg:grid-cols-[220px_1fr_260px] lg:items-start lg:gap-6 lg:px-0">
      <aside className="mt-12 hidden lg:block">
        <div className="sticky top-6 flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Tổng quan
            </p>
            <div className="flex flex-col gap-2 text-sm">
              {FILTER_OPTIONS.filter((opt) => opt.value !== "all").map(
                (opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setStatusFilter(
                        statusFilter === opt.value ? "all" : opt.value,
                      )
                    }
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors ${statusFilter === opt.value ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <span>{opt.label}</span>
                    <span className="font-semibold">
                      {statusCounts[opt.value]}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
          {nearestAppointment && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                <CalendarCheck size={14} /> Lịch hẹn gần nhất
              </p>
              <p className="text-sm font-semibold text-[#262626]">
                {nearestAppointment.docData.name}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {formatSlotDate(nearestAppointment.slotDate)} |{" "}
                {nearestAppointment.slotTime}
              </p>
            </div>
          )}
        </div>
      </aside>

      <div>
        <p className="mt-12 pb-3 text-lg font-medium text-gray-600">
          Lịch hẹn của tôi
        </p>
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-9 text-sm text-[#363636] outline-none transition-colors focus:border-primary focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <SlidersHorizontal
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-0 pl-8 pr-8 text-sm text-[#363636] outline-none focus:border-primary sm:w-48"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <ArrowUpDown
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-0 pl-8 pr-8 text-sm text-[#363636] outline-none focus:border-primary sm:w-48"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="mt-5 flex flex-col gap-4">
            {visibleAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
                <Inbox size={22} className="text-gray-300" />
                {hasActiveFilters
                  ? "Không tìm thấy lịch hẹn phù hợp"
                  : "Bạn chưa có lịch hẹn nào"}
              </div>
            ) : (
              visibleAppointments.map((item) => {
                const status = getAppointmentStatus(item);
                const meta = STATUS_META[status];

                return (
                  <div
                    key={item._id}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                      <img
                        className="h-28 w-28 self-start rounded-xl bg-[#EAEFFF] object-cover"
                        src={item.docData.image}
                        alt=""
                      />
                      <div className="flex-1 text-sm text-[#5E5E5E]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-base font-semibold text-[#262626]">
                            {item.docData.name}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-primary">
                          {translateSpeciality(item.docData.speciality)}
                        </p>
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                          <span>
                            {item.docData.address.line1},{" "}
                            {item.docData.address.line2}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock size={14} className="shrink-0" />
                          <span>
                            {formatSlotDate(item.slotDate)} | {item.slotTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex w-full flex-col justify-center gap-2 text-sm sm:w-52">
                        {!item.cancelled &&
                          !item.payment &&
                          !item.isCompleted && (
                            <button
                              disabled={!item.isAccepted}
                              onClick={() =>
                                item.isAccepted && setPayment(item._id)
                              }
                              className={`w-full rounded-lg border py-2 text-center transition-all duration-300 ${item.isAccepted ? "text-[#696969] hover:bg-primary hover:text-white" : "cursor-not-allowed bg-gray-100 text-gray-400 opacity-60"}`}
                            >
                              Thanh toán online
                            </button>
                          )}

                        {/* KHU VỰC CHỌN CỔNG THANH TOÁN KHI BẤM THANH TOÁN ONLINE */}
                        {!item.cancelled &&
                          !item.payment &&
                          !item.isCompleted &&
                          item.isAccepted &&
                          payment === item._id && (
                            <div className="mt-1 grid grid-cols-2 gap-2 animate-fadeIn">
                              <button
                                onClick={() => appointmentVNPay(item._id)}
                                className="flex items-center justify-center rounded-lg border py-2 bg-white transition-all duration-300 hover:bg-blue-50 hover:border-blue-300"
                              >
                                <img
                                  className="max-h-5 object-contain"
                                  src={
                                    assets.vnpay_logo ||
                                    "https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo-vnpay.svg"
                                  }
                                  alt="VNPay"
                                />
                              </button>

                              <button
                                onClick={() => appointmentStripe(item._id)}
                                className="flex items-center justify-center rounded-lg border py-2 bg-white transition-all duration-300 hover:bg-gray-50"
                              >
                                <img
                                  className="max-h-5 max-w-20"
                                  src={assets.stripe_logo}
                                  alt="Stripe"
                                />
                              </button>
                            </div>
                          )}

                        {/* NÚT TRẠNG THÁI ĐÃ THANH TOÁN & NÚT XEM HÓA ĐƠN ĐI KÈM */}
                        {!item.cancelled &&
                          item.payment &&
                          !item.isCompleted && (
                            <div className="flex flex-col gap-1.5">
                              <button className="w-full cursor-default rounded-lg border bg-[#EAEFFF] py-2 font-medium text-primary">
                                Đã thanh toán
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedInvoiceAppointment(item);
                                  setShowInvoiceModal(true);
                                }}
                                className="w-full rounded-lg border border-gray-200 bg-white py-1.5 text-xs text-gray-600 transition-all hover:bg-gray-50 hover:text-black"
                              >
                                📄 Xem hóa đơn thanh toán
                              </button>
                            </div>
                          )}

                        {item.isCompleted && (
                          <div className="flex flex-col gap-1.5">
                            <button className="w-full rounded-lg border border-green-500 py-2 text-green-500 font-medium">
                              Hoàn thành
                            </button>
                            {item.payment && (
                              <button
                                onClick={() => {
                                  setSelectedInvoiceAppointment(item);
                                  setShowInvoiceModal(true);
                                }}
                                className="w-full rounded-lg border border-gray-200 bg-white py-1.5 text-xs text-gray-600 transition-all hover:bg-gray-50 hover:text-black"
                              >
                                📄 Xem hóa đơn thanh toán
                              </button>
                            )}
                          </div>
                        )}

                        {!item.cancelled && !item.isCompleted && (
                          <button
                            onClick={() => cancelAppointment(item._id)}
                            className="w-full rounded-lg border py-2 text-[#696969] transition-all duration-300 hover:bg-red-600 hover:text-white"
                          >
                            Hủy lịch hẹn
                          </button>
                        )}
                        {item.cancelled && !item.isCompleted && (
                          <button className="w-full rounded-lg border border-red-500 py-2 text-red-500">
                            Đã hủy lịch hẹn
                          </button>
                        )}
                        {!item.cancelled &&
                          !item.payment &&
                          !item.isCompleted &&
                          !item.isAccepted && (
                            <p className="text-center text-xs text-gray-400">
                              Chờ bác sĩ xác nhận trước khi thanh toán
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ==================== POPUP MODAL HIỂN THỊ HÓA ĐƠN CHUẨN ==================== */}
          {showInvoiceModal && selectedInvoiceAppointment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn">
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header hóa đơn */}
                <div className="bg-primary p-5 text-center text-white">
                  <h3 className="text-lg font-bold uppercase tracking-wide">
                    Hóa Đơn Thanh Toán
                  </h3>
                  <p className="mt-1 text-xs opacity-80">
                    Mã giao dịch điện tử hệ thống
                  </p>
                </div>

                {/* Thân hóa đơn */}
                <div className="p-6 text-sm text-gray-600">
                  <div className="mb-4 flex justify-between border-b border-dashed border-gray-200 pb-3">
                    <span className="font-medium text-gray-800">
                      Mã lịch hẹn:
                    </span>
                    <span className="font-mono text-gray-900 font-semibold">
                      {selectedInvoiceAppointment._id}
                    </span>
                  </div>

                  <div className="space-y-2.5 pb-4">
                    <div className="flex justify-between">
                      <span>Bác sĩ khám:</span>
                      <span className="font-medium text-gray-900">
                        {selectedInvoiceAppointment.docData.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chuyên khoa:</span>
                      <span className="text-gray-900">
                        {translateSpeciality(
                          selectedInvoiceAppointment.docData.speciality,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời gian khám:</span>
                      <span className="text-gray-900">
                        {selectedInvoiceAppointment.slotTime} -{" "}
                        {formatSlotDate(selectedInvoiceAppointment.slotDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hình thức thanh toán:</span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        Cổng Online (VNPay/Stripe)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái đơn:</span>
                      <span className="text-green-600 font-medium">
                        ● Thành công
                      </span>
                    </div>
                  </div>

                  {/* Khối hiển thị số tiền thanh toán tổng */}
                  <div className="mt-4 rounded-xl bg-gray-50 p-4 flex justify-between items-center border border-gray-100">
                    <span className="text-base font-semibold text-gray-800">
                      Tổng tiền chi trả:
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {Number(
                        selectedInvoiceAppointment.amount ||
                          selectedInvoiceAppointment.docData.fees,
                      ).toLocaleString("vi-VN")}{" "}
                      đ
                    </span>
                  </div>

                  <p className="mt-5 text-center text-xs text-gray-400 italic">
                    Cảm ơn bạn đã tin tưởng dịch vụ Medicare của chúng tôi!
                  </p>
                </div>

                {/* Nút Đóng */}
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3.5 flex justify-end">
                  <button
                    onClick={() => {
                      setShowInvoiceModal(false);
                      setSelectedInvoiceAppointment(null);
                    }}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="mt-12 hidden lg:block">
        <div className="sticky top-6 flex flex-col gap-4">
          <a
            href="/doctors"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <PlusCircle size={16} /> Đặt lịch mới
          </a>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <PhoneCall size={14} /> Cần hỗ trợ?
            </p>
            <p className="text-sm text-[#363636]">Hotline: 1900 1234</p>
            <p className="mt-0.5 text-sm text-[#363636]">support@clinic.vn</p>
          </div>
        </div>
      </aside>

      {/* STRIPE MODAL GIỮ NGUYÊN */}
      {stripeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-[650px] overflow-hidden border border-gray-300 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative overflow-hidden bg-[#002d72] px-6 py-5 text-white sm:px-8">
              <p className="text-[24px] font-bold uppercase tracking-wide">
                NAPAS PAYMENT GATEWAY
              </p>
            </div>
            <div className="px-6 py-5 sm:px-8">
              <form onSubmit={confirmStripePayment} className="space-y-5">
                <div className="grid grid-cols-[190px_1fr] items-center gap-4">
                  <label className="text-right text-sm font-medium text-[#4b5563]">
                    Tên chủ thẻ :::
                  </label>
                  <input
                    name="cardholderName"
                    value={stripeForm.cardholderName}
                    onChange={handleStripeFieldChange}
                    type="text"
                    className="h-11 w-full border border-[#b9d4ff] bg-[#f5f7fb] px-4 text-sm outline-none"
                  />
                </div>
                <div className="grid grid-cols-[190px_1fr] items-center gap-4">
                  <label className="text-right text-sm font-medium text-[#4b5563]">
                    Số thẻ :::
                  </label>
                  <input
                    name="cardNumber"
                    value={stripeForm.cardNumber}
                    onChange={handleStripeFieldChange}
                    type="text"
                    className="h-11 w-full border border-[#1d4ed8] bg-[#f5f7fb] px-4 text-sm outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="submit"
                    className="min-w-32 rounded-md bg-[#1d4ed8] px-6 py-2.5 text-sm font-medium text-white"
                  >
                    Thanh toán
                  </button>
                  <button
                    type="button"
                    onClick={closeStripeModal}
                    className="min-w-32 rounded-md bg-[#e5e7eb] px-6 py-2.5 text-sm text-[#374151]"
                  >
                    Huỷ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
