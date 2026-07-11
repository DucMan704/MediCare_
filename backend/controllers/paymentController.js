import {
  VNPay,
  HashAlgorithm,
  ProductCode,
  VnpLocale,
  dateFormat,
  ignoreLogger,
} from "vnpay";
import vnpay from "../config/vnpay.js";
import "dotenv/config";

import { findDoctorFeeByAppointmentId } from "./userController.js";
import appointmentModel from "../models/appointmentModel.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const returnUrl = `${FRONTEND_URL}/return-vnpay`;

// export const paymentVNPay = async (req, res) => {
//   const tomorrow = new Date();
//   tomorrow.setDate(tomorrow.getDate() + 1);

//   const txnRef = Date.now().toString();
//   const paymentUrl = vnpay.buildPaymentUrl({
//     vnp_Amount: 10000,
//     vnp_IpAddr: "13.160.92.202",
//     vnp_TxnRef: txnRef,
//     vnp_OrderInfo: `Thanh toan don hang ${txnRef}`,
//     vnp_OrderType: ProductCode.Other,
//     vnp_ReturnUrl: "https://medicare-for-user.vercel.app/return-vnpay",
//     vnp_Locale: VnpLocale.VN,
//     vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là thời gian hiện tại
//     vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn
//   });
// };

// API 1: Khởi tạo đường dẫn thanh toán VNPay

export const paymentVNPay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing appointmentId" });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Lấy số tiền từ database của bác sĩ
    const vnp_Amount = await findDoctorFeeByAppointmentId(appointmentId);

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: vnp_Amount, // VNPay yêu cầu số tiền là số nguyên (đơn vị: đồng), nhân với 100 để chuyển đổi từ VND sang "đồng"
      vnp_IpAddr: "13.160.92.202",
      vnp_TxnRef: `${appointmentId}_${Date.now()}`, // Gộp appointmentId để lúc về tách ra
      vnp_OrderInfo: `Thanh toan lich hen ${appointmentId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });
    return res.status(200).json({ success: true, paymentUrl });
  } catch (error) {
    console.error("Payment VNPay Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// API 2: Kiểm tra dữ liệu trả về từ URL (Return URL)
export const checkPaymentVNPay = async (req, res) => {
  try {
    const queryData = req.query;

    // 1. Xác thực chữ ký mã hóa từ VNPay (Chống hack, chống sửa đổi số tiền)
    const verify = vnpay.verifyReturnUrl(queryData);
    if (!verify.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Xác thực tính toàn vẹn dữ liệu thất bại",
      });
    }

    // 2. Kiểm tra nếu khách hàng chủ động bấm HỦY (Mã kết quả 24)
    if (queryData.vnp_ResponseCode === "24") {
      return res.status(200).json({
        success: false,
        isCancelled: true,
        message: "Người dùng đã hủy bỏ phiên thanh toán.",
      });
    }

    // 3. Kiểm tra các lỗi thanh toán khác từ đối tác ngân hàng (Mã khác 00)
    if (!verify.isSuccess) {
      return res.status(200).json({
        success: false,
        message: "Thanh toán thất bại hoặc có lỗi xảy ra từ ngân hàng.",
      });
    }

    // 4. XỬ LÝ KHI THANH TOÁN THÀNH CÔNG (Mã vnp_ResponseCode === "00")
    const txnRef = queryData.vnp_TxnRef;
    const appointmentId = txnRef.split("_")[0]; // Tách chuỗi lấy lại appointmentId ban đầu
    // Cập nhật trạng thái thanh toán của cuộc hẹn trong database thành TRUE
    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { payment: true },
      { new: true },
    );
    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn tương ứng để cập nhật dữ liệu",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Thanh toán thành công và đã cập nhật lịch hẹn!",
      data: verify,
    });
  } catch (error) {
    console.error("Verify VNPay Return Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
