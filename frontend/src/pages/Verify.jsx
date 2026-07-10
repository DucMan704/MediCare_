import React, { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const ReturnVNPay = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Sử dụng useRef để tránh việc useEffect chạy StrictMode bị lặp request 2 lần
  const isCalled = useRef(false);

  useEffect(() => {
    if (isCalled.current) return;
    isCalled.current = true;

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    // Lấy token người dùng từ localStorage (tùy thuộc vào AppContext của bạn)
    const token = localStorage.getItem("token");

    const verifyPayment = async () => {
      try {
        // Gửi hộ tống toàn bộ tham số VNPay trả về lên backend xác thực
        const { data } = await axios.get(
          `${backendUrl}/api/user/check-payment-vnpay?${searchParams.toString()}`,
          { headers: { token } },
        );

        if (data.success) {
          toast.success("🎉 Đã thanh toán lịch hẹn thành công!");
        } else if (data.isCancelled) {
          toast.info("Bạn đã hủy phiên thanh toán.");
        } else {
          toast.error(data.message || "Thanh toán thất bại.");
        }
      } catch (error) {
        console.error("Error verifying VNPay payment:", error);
        toast.error("Đã xảy ra lỗi hệ thống khi xác thực giao dịch.");
      } finally {
        // Luôn luôn điều hướng người dùng về lại trang danh sách sau khi thông báo kết thúc
        navigate("/my-appointments");
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-4 text-sm font-medium text-gray-500">
        Đang đồng bộ trạng thái giao dịch với hệ thống, vui lòng không tắt trình
        duyệt...
      </p>
    </div>
  );
};

export default ReturnVNPay;
