import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message:
      "Bạn đã thử đăng nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút.",
  },
});
