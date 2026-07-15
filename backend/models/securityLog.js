import mongoose from "mongoose";

const securityLogSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },
    action: {
      type: String,
      required: true, // Ví dụ: "Thay đổi mật khẩu"
    },
    status: {
      type: String,
      enum: ["Thành công", "Thất bại"],
      required: true,
    },
    ipAddress: { type: String },
    userAgent: { type: String }, // Lưu thông tin trình duyệt/thiết bị
  },
  { timestamps: true },
);

const SecurityLog =
  mongoose.models.SecurityLog ||
  mongoose.model("SecurityLog", securityLogSchema);
export default SecurityLog;
