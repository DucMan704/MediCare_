import { VNPay, ignoreLogger } from "vnpay";

const vnpay = new VNPay({
    tmnCode: process.env.TMNCODE,
    secureSecret: process.env.SECURE_SECRET,
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: "SHA512",
    loggerFn: ignoreLogger,
});

export default vnpay;