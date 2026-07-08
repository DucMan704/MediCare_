import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { formatSlotDate, translateSpeciality } from "../utils/i18n";

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
        console.log(response);

        try {
          const { data } = await axios.post(
            backendUrl + "/api/user/verifyRazorpay",
            response,
            { headers: { token } },
          );
          if (data.success) {
            navigate("/my-appointments");
            getUserAppointments();
          }
        } catch (error) {
          console.log(error);
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
      console.log(error);
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
    setStripeForm((current) => ({
      ...current,
      [name]: value,
    }));
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
        {
          appointmentId: stripeAppointmentId,
          success: "true",
        },
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
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token]);

  return (
    <div>
      <p className="pb-3 mt-12 text-lg font-medium text-gray-600 border-b">
        Lịch hẹn của tôi
      </p>
      <div className="">
        {appointments.map((item, index) => (
          <React.Fragment key={index}>
            <div className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b">
              <div>
                <img
                  className="w-36 bg-[#EAEFFF]"
                  src={item.docData.image}
                  alt=""
                />
              </div>
              <div className="flex-1 text-sm text-[#5E5E5E]">
                <p className="text-[#262626] text-base font-semibold">
                  {item.docData.name}
                </p>
                <p>{translateSpeciality(item.docData.speciality)}</p>
                <p className="text-[#464646] font-medium mt-1">Địa chỉ:</p>
                <p className="">{item.docData.address.line1}</p>
                <p className="">{item.docData.address.line2}</p>
                <p className=" mt-1">
                  <span className="text-sm text-[#3C3C3C] font-medium">
                    Ngày & Giờ:
                  </span>{" "}
                  {formatSlotDate(item.slotDate)} | {item.slotTime}
                </p>
              </div>
              <div></div>
              <div className="flex flex-col gap-2 justify-end text-sm text-center">
                {!item.cancelled && !item.payment && !item.isCompleted && (
                  <button
                    disabled={!item.isAccepted}
                    onClick={() => item.isAccepted && setPayment(item._id)}
                    className={`sm:min-w-48 py-2 border rounded transition-all duration-300 ${
                      item.isAccepted
                        ? "text-[#696969] hover:bg-primary hover:text-white"
                        : "bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    Thanh toán online
                  </button>
                )}
                {!item.cancelled &&
                  !item.payment &&
                  !item.isCompleted &&
                  item.isAccepted &&
                  payment === item._id && (
                    <button
                      onClick={() => appointmentStripe(item._id)}
                      className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center"
                    >
                      <img
                        className="max-w-20 max-h-5"
                        src={assets.stripe_logo}
                        alt=""
                      />
                    </button>
                  )}
                {isRazorpayConfigured &&
                  !item.cancelled &&
                  !item.payment &&
                  !item.isCompleted &&
                  item.isAccepted &&
                  payment === item._id && (
                    <button
                      onClick={() => appointmentRazorpay(item._id)}
                      className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center"
                    >
                      <img
                        className="max-w-20 max-h-5"
                        src={assets.razorpay_logo}
                        alt=""
                      />
                    </button>
                  )}
                {!item.cancelled && item.payment && !item.isCompleted && (
                  <button className="sm:min-w-48 py-2 border rounded text-[#696969]  bg-[#EAEFFF]">
                    Đã thanh toán
                  </button>
                )}

                {item.isCompleted && (
                  <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
                    Hoàn thành
                  </button>
                )}

                {!item.cancelled && !item.isCompleted && (
                  <button
                    onClick={() => cancelAppointment(item._id)}
                    className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
                  >
                    Hủy lịch hẹn
                  </button>
                )}
                {item.cancelled && !item.isCompleted && (
                  <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                    Đã hủy lịch hẹn
                  </button>
                )}
                {!item.cancelled &&
                  !item.payment &&
                  !item.isCompleted &&
                  !item.isAccepted && (
                    <p className="text-xs text-gray-400">
                      Chờ bác sĩ xác nhận trước khi thanh toán
                    </p>
                  )}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {stripeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-[650px] overflow-hidden border border-gray-300 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative overflow-hidden bg-[#002d72] px-6 py-5 text-white sm:px-8">
              <div className="absolute right-0 top-0 h-full w-24 overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-20 bg-[#9ab83d] transform skew-x-[-35deg] origin-top-right" />
                <div className="absolute right-10 top-0 h-full w-24 bg-[#8ec5ff] transform skew-x-[-35deg] origin-top-right opacity-90" />
              </div>
              <p className="text-[24px] font-bold uppercase tracking-wide">
                NAPAS PAYMENT GATEWAY
              </p>
            </div>

            <div className="px-6 py-5 sm:px-8">
              <div className="mb-7 text-left">
                <div className="flex items-center gap-2 text-[#1d4ed8]">
                  <span className="text-[34px] font-extrabold italic leading-none">
                    napas
                  </span>
                  <span className="text-[22px] font-bold">➜</span>
                </div>
                <p className="mt-1 text-sm text-[#2563eb]">
                  Một kết nối. Mọi thanh toán.
                </p>
              </div>

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
                    placeholder="Nhập tên chủ thẻ"
                    className="h-11 w-full border border-[#b9d4ff] bg-[#f5f7fb] px-4 text-sm outline-none focus:border-[#1d4ed8]"
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
                    inputMode="numeric"
                    placeholder="Nhập số thẻ"
                    className="h-11 w-full border border-[#1d4ed8] bg-[#f5f7fb] px-4 text-sm outline-none focus:border-[#003399]"
                  />
                </div>

                <div className="grid grid-cols-[190px_1fr] items-center gap-4">
                  <label className="text-right text-sm font-medium text-[#4b5563]">
                    Ngày phát hành :::
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      name="expiryMonth"
                      value={stripeForm.expiryMonth}
                      onChange={handleStripeFieldChange}
                      type="text"
                      inputMode="numeric"
                      placeholder="MM"
                      className="h-11 w-20 border border-[#b9d4ff] bg-[#f5f7fb] px-4 text-sm outline-none focus:border-[#1d4ed8]"
                    />
                    <span className="text-lg font-semibold text-[#64748b]">
                      /
                    </span>
                    <input
                      name="expiryYear"
                      value={stripeForm.expiryYear}
                      onChange={handleStripeFieldChange}
                      type="text"
                      inputMode="numeric"
                      placeholder="YY"
                      className="h-11 w-20 border border-[#b9d4ff] bg-[#f5f7fb] px-4 text-sm outline-none focus:border-[#1d4ed8]"
                    />
                    <span className="text-sm text-[#6b7280]">tháng/năm</span>
                  </div>
                </div>

                <div className="grid grid-cols-[190px_1fr] items-start gap-4 pt-2">
                  <span className="text-right text-sm font-medium text-[#4b5563]">
                    Nhà cung cấp :::
                  </span>
                  <span className="text-sm font-medium text-[#312e81]">
                    CTCP PHẦN MỀM VÀ TRUYỀN THÔNG GMOBI VIỆT NAM
                  </span>
                </div>

                <div className="grid grid-cols-[190px_1fr] items-start gap-4">
                  <span className="text-right text-sm font-medium text-[#4b5563]">
                    Đơn hàng :::
                  </span>
                  <span className="text-sm text-[#a1a1aa]">
                    {selectedStripeAppointment
                      ? selectedStripeAppointment._id
                      : ""}
                  </span>
                </div>

                <div className="grid grid-cols-[190px_1fr] items-start gap-4">
                  <span className="text-right text-sm font-medium text-[#4b5563]">
                    Số tiền :::
                  </span>
                  <span className="text-sm text-[#a1a1aa]">
                    {selectedStripeAppointment?.amount
                      ? `${selectedStripeAppointment.amount.toLocaleString("vi-VN")} ${currencySymbol}`
                      : ""}
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="submit"
                    className="min-w-32 rounded-md bg-[#1d4ed8] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#003399]"
                  >
                    Thanh toán
                  </button>
                  <button
                    type="button"
                    onClick={closeStripeModal}
                    className="min-w-32 rounded-md bg-[#e5e7eb] px-6 py-2.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#d1d5db]"
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
