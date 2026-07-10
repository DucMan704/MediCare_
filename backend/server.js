import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser"; // Bắt buộc phải có để đọc refreshToken

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import messageRouter from "./routes/messageRoute.js";
import { globalLimiter } from "./middleware/rateLimit.js";

const app = express();
const port = process.env.PORT || 4000;

// Kết nối database & services
connectDB();
connectCloudinary();

const allowedOrigins = [
  // Local development
  "http://localhost:5173",
  "http://localhost:5174",

  // Production frontend
  "https://medicare-for-user.vercel.app/",
  "https://medi-care-puce-phi.vercel.app/",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép request không có origin (Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true, // Cho phép đính kèm Cookie giữa các domain
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "token", // User token
    "atoken", // Admin token
    "dtoken", // Doctor token (ĐÃ THÊM ĐỂ FIX LỖI CORS LÚC NÃY)
  ],
};

// --- MIDDLEWARES ---
// Khai báo CORS đầu tiên để nó bảo vệ toàn bộ route bên dưới
app.use(cors(corsOptions));

// Xử lý JSON payload từ request body
app.use(express.json());

// Phân tích Cookie từ request (Cần npm install cookie-parser nếu chưa có)
app.use(cookieParser());

// Giới hạn rate limit chống spam API
app.use(globalLimiter);

// --- ROUTES ---
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/messages", messageRouter);

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked - Origin không hợp lệ",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

app.listen(port, () => {
  console.log(`Server running on PORT:${port}`);
});
