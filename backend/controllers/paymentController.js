import "dotenv/config";
import { VNPay, ProductCode, VnpLocale, dateFormat, ignoreLogger } from "vnpay";
import { findDoctorFeeByAppointmentId } from "./userController.js";
import appointmentModel from "../models/appointmentModel.js";

// Khởi tạo cấu hình VNPay Sandbox (Khi lên chạy thật, bạn chỉ cần đổi vnpayHost thành URL thật của VNPay)
const vnpay = new VNPay({
  tmnCode: process.env.TMNCODE,
  secureSecret: process.env.SECURE_SECRET,
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true, // Nếu chạy thật trên Production thì đổi thành false
  hashAlgorithm: "SHA512",
  loggerFn: ignoreLogger,
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const returnUrl = `${FRONTEND_URL}/return-vnpay`;

// API 1: Khởi tạo đường dẫn thanh toán VNPay
export const paymentVNPay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing appointmentId" });
    }

    const now = new Date();
    const expire = new Date(now.getTime() + 15 * 60 * 1000); // Hết hạn sau 15 phút

    // Lấy số tiền từ database của bác sĩ
    const vnp_Amount = await findDoctorFeeByAppointmentId(appointmentId);

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: vnp_Amount,
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_TxnRef: `${appointmentId}_${Date.now()}`, // Gộp appointmentId để lúc về tách ra
      vnp_OrderInfo: `Thanh toan lich hen ${appointmentId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(now),
      vnp_ExpireDate: dateFormat(expire),
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
