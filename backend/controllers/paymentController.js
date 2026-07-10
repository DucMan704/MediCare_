import "dotenv/config";
import {
  VNPay,
  HashAlgorithm,
  ProductCode,
  VnpLocale,
  dateFormat,
  ignoreLogger,
} from "vnpay";

// 1. Khởi tạo cấu hình VNPay dùng chung cho toàn bộ file controller
const vnpay = new VNPay({
  tmnCode: process.env.TMNCODE,
  secureSecret: process.env.SECURE_SECRET,
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true, // Ép buộc chạy môi trường Sandbox thử nghiệm
  hashAlgorithm: "SHA512",
  loggerFn: ignoreLogger,
});

// API: Khởi tạo đường dẫn thanh toán VNPay
export const paymentVNPay = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Xây dựng URL thanh toán (Cần thay thế các giá trị cứng bằng dữ liệu thực tế từ req.body nếu cần)
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: 10000, // Số tiền (Đơn vị: VND, thư viện tự nhân 100 theo yêu cầu VNPay)
      vnp_IpAddr: req.ip || "127.0.0.1", // Lấy IP thực tế của client thay vì gán cứng
      vnp_TxnRef: String(Date.now()), // Tạo mã đơn hàng duy nhất bằng timestamp để tránh trùng lặp
      vnp_OrderInfo: "Thanh toan don hang bang VNPay",
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: "http://localhost:3000/vnpay-return", // URL Front-end nhận kết quả
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

// API: Kiểm tra dữ liệu trả về từ URL (Return URL)
export const checkPaymentVNPay = async (req, res) => {
  try {
    // Sửa lỗi chính tả req.querry -> req.query
    const queryData = req.query;

    // Xác thực tính toàn vẹn và chữ ký của dữ liệu trả về từ VNPay
    const verify = vnpay.verifyReturnUrl(queryData);

    if (!verify.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Xác thực tính toàn vẹn dữ liệu thất bại",
      });
    }

    if (!verify.isSuccess) {
      return res
        .status(400)
        .json({ success: false, message: "Đơn hàng thanh toán thất bại" });
    }

    // Xác thực thành công (Lưu ý: Chỉ xử lý giao diện hiển thị cho Client tại đây)
    return res.status(200).json({
      success: true,
      message: "Xác thực URL trả về thành công",
      data: verify,
    });
  } catch (error) {
    console.error("Verify VNPay Return Error:", error);
    return res
      .status(400)
      .json({ success: false, message: "Dữ liệu không hợp lệ" });
  }
};
