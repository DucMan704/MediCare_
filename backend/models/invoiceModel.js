import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true }, // Mã hóa đơn tự sinh (VD: INV-17189234)
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "appointment",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },
    amount: { type: Number, required: true }, // Số tiền thực tế thanh toán (VND)
    paymentMethod: { type: String, default: "VNPay" },
    bankCode: { type: String }, // Mã ngân hàng khách dùng (VD: NCB, Vietcombank...)
    vnpTransactionNo: { type: String, required: true }, // Mã giao dịch của hệ thống VNPay
    orderInfo: { type: String }, // Nội dung thanh toán
    status: {
      type: String,
      enum: ["paid", "failed", "refunded"],
      default: "paid",
    },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const invoiceModel =
  mongoose.models.invoice || mongoose.model("invoice", invoiceSchema);
export default invoiceModel;
