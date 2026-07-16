import mongoose from "mongoose";

const appointmentInfoSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "appointment",
      required: true,
    }, // Liên kết ngược lại lịch hẹn (tùy chọn nhưng nên có)
    symptomDescription: { type: String, required: true },
    painLocation: { type: String, default: null },
    painLevel: { type: Number, required: true },
    startDate: { type: String, default: null },
    daysSick: { type: Number, default: null },
    currentCondition: { type: String, default: "" },
    hasTakenMedication: { type: String, default: "" },
    additionalNotes: { type: String, default: null },
  },
  { timestamps: true },
);

const appointmentInfoModel =
  mongoose.models.appointmentInfo ||
  mongoose.model("appointmentInfo", appointmentInfoSchema);

export default appointmentInfoModel;
