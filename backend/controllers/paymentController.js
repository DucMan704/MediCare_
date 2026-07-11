import { VNPay, HashAlgorithm, ProductCode, VnpLocale, dateFormat } from 'vnpay';
import { ignoreLogger } from 'vnpay';
import vnpay from "../config/vnpay.js";




export const paymentVNPay = async (req, res) => {
 

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

 const txnRef = Date.now().toString();
 const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: 10000,
    vnp_IpAddr: '13.160.92.202',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Thanh toan don hang ${txnRef}`,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: 'https://medicare-for-user.vercel.app/return-vnpay',
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