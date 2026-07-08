import { VNPay, HashAlgorithm, ProductCode, VnpLocale, dateFormat } from 'vnpay';
import { ignoreLogger } from 'vnpay';




export const paymentVNPay = async (req, res) => {
 const vnpay = new VNPay({
    tmnCode: process.env.TMNCODE,
    secureSecret: process.env.SECURE_SECRET,
    vnpayHost: 'https://sandbox.vnpayment.vn',
   // queryDrAndRefundHost: 'https://sandbox.vnpayment.vn', // tùy chọn, trường hợp khi url của querydr và refund khác với url khởi tạo thanh toán (thường sẽ sử dụng cho production)
    testMode: true, // tùy chọn, ghi đè vnpayHost thành sandbox nếu là true
    hashAlgorithm: 'SHA512', // tùy chọn
   // enableLog: true, // tùy chọn
    loggerFn: ignoreLogger, // tùy chọn
});

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

 const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: 10000,
    vnp_IpAddr: '13.160.92.202',
    vnp_TxnRef: '123456',
    vnp_OrderInfo: 'Thanh toan don hang 123456',
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: 'http://localhost:3000/vnpay-return',
    vnp_Locale: VnpLocale.VN, 
    vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là thời gian hiện tại
    vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn
});

    return res.status(200).json({ paymentUrl });
}

export const checkPaymentVNPay = async (req, res) => {
    let verify
    try {
        // Sử dụng try-catch để bắt lỗi nếu query không hợp lệ hoặc thiếu dữ liệu
        console.log(req.querry);
        verify = vnpay.verifyReturnUrl(req.query);
        if (!verify.isVerified) {
            return res.send('Xác thực tính toàn vẹn dữ liệu thất bại');
        }
        if (!verify.isSuccess) {
            return res.send('Đơn hàng thanh toán thất bại');
        }
    } catch (error) {
        return res.send('Dữ liệu không hợp lệ');
    }

    // Kiểm tra thông tin đơn hàng và xử lý tương ứng
    // Chỉ xử lý liên quan đến UI ở đây, không xử lý logic kinh doanh
    // Logic kinh doanh quan trọng phải được xử lý ở phía server bằng IPN

    return res.send('Xác thực URL trả về thành công');
}