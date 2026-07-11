import "dotenv/config";
import { VNPay, ProductCode, VnpLocale, dateFormat, ignoreLogger } from "vnpay";
import { findDoctorFeeByAppointmentId } from "./userController.js";
import appointmentModel from "../models/appointmentModel.js";
import { randomBytes } from "crypto";

// Khởi tạo cấu hình VNPay
const vnpay = new VNPay({
  tmnCode: process.env.TMNCODE,
  secureSecret: process.env.SECURE_SECRET,
  vnpayHost: "https://sandbox.vnpayment.vn", // Khi chạy thật, đổi thành URL thật của VNPay
  testMode: false, // Nếu chạy thật trên Production thì đổi thành false
  hashAlgorithm: "SHA512",
  loggerFn: ignoreLogger,
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const returnUrl = `${FRONTEND_URL}/return-vnpay`;

// ==========================================
// API 1: Khởi tạo đường dẫn thanh toán VNPay
// ==========================================
export const paymentVNPay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing appointmentId" });
    }

    // 1. Kiểm tra lịch hẹn có tồn tại không
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch hẹn" });
    }

    // 2. Tạo mã vnp_TxnRef chuẩn: Độ dài ~14 ký tự (Dưới hạn 24 ký tự của VNPay), không ký tự đặc biệt
    const uniqueStr = randomBytes(3).toString("hex"); // 6 ký tự ngẫu nhiên (VD: a1b2c3)
    const timeStr = Date.now().toString().slice(-6); // 6 ký tự cuối của timestamp
    const txnRef = `DH${uniqueStr}${timeStr}`; // Kết quả dạng: DHa1b2c3456789

    const now = new Date();
    const expire = new Date(now.getTime() + 15 * 60 * 1000); // Hết hạn sau 15 phút

    // Lấy số tiền từ database của bác sĩ
    const rawAmount = await findDoctorFeeByAppointmentId(appointmentId);

    // Quy định VNPay: Số tiền phải nhân với 100
    const vnp_Amount = rawAmount * 100;

    // Chuẩn hóa IP Client (Xử lý trường hợp localhost trả về IPv6 `::1` hoặc `::ffff:`)
    let clientIp = req.ip || "127.0.0.1";
    if (clientIp.includes("::ffff:")) {
      clientIp = clientIp.replace("::ffff:", "");
    }
    if (clientIp === "::1") {
      clientIp = "127.0.0.1";
    }

    // 3. Lưu mã txnRef vào lịch hẹn trong DB trước khi chuyển hướng sang VNPay
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      vnpTxnRef: txnRef,
    });

    // 4. Tạo URL thanh toán
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: vnp_Amount,
      vnp_IpAddr: clientIp,
      vnp_TxnRef: txnRef,
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

// ==========================================
// API 2: Kiểm tra dữ liệu trả về từ URL (Return URL)
// ==========================================
export const checkPaymentVNPay = async (req, res) => {
  try {
    const queryData = req.query;

    // 1. Xác thực chữ ký mã hóa từ VNPay (Chống hack/sửa đổi số tiền)
    const verify = vnpay.verifyReturnUrl(queryData);

    if (!verify.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Xác thực tính toàn vẹn dữ liệu thất bại",
      });
    }

    // 2. Tìm lịch hẹn tương ứng dựa vào mã vnp_TxnRef
    const txnRef = queryData.vnp_TxnRef;
    const appointment = await appointmentModel.findOne({ vnpTxnRef: txnRef });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn tương ứng với mã giao dịch này",
      });
    }

    // 3. XỬ LÝ IDEMPOTENCY: Nếu lịch hẹn đã được thanh toán thành công trước đó (bởi IPN hoặc webhook khác)
    // thì không cần chạy lại logic xử lý lỗi/hủy bên dưới nữa. Trả về thành công luôn.
    if (appointment.payment === true) {
      return res.status(200).json({
        success: true,
        message: "Lịch hẹn đã được xác nhận thanh toán trước đó thành công!",
        data: verify,
      });
    }

    // 4. Kiểm tra nếu khách hàng chủ động bấm HỦY tại cổng VNPay (Mã kết quả 24)
    if (queryData.vnp_ResponseCode === "24") {
      return res.status(200).json({
        success: false,
        isCancelled: true,
        message: "Người dùng đã hủy bỏ phiên thanh toán.",
      });
    }

    // 5. Kiểm tra các lỗi thanh toán khác từ đối tác ngân hàng (Mã khác 00)
    if (!verify.isSuccess) {
      return res.status(200).json({
        success: false,
        message: "Thanh toán thất bại hoặc có lỗi xảy ra từ ngân hàng.",
      });
    }

    // 6. XỬ LÝ KHI THANH TOÁN THÀNH CÔNG (Mã vnp_ResponseCode === "00")
    // Cập nhật trạng thái thanh toán của cuộc hẹn thành TRUE
    appointment.payment = true;
    await appointment.save();

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
