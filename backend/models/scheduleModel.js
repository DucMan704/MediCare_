import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },

    // Ngày làm việc
    workDate: {
      type: Date,
      required: true,
    },

    // Khung giờ
    timeSlot: {
      type: String,
      required: true,
      enum: [
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
      ],
    },

    // Bác sĩ có mở lịch hay không
    available: {
      type: Boolean,
      default: true,
    },

    // Đã có bệnh nhân đặt chưa
    isBooked: {
      type: Boolean,
      default: false,
    },

    // Nếu đã đặt thì lưu appointment
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "appointment",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Không cho tạo trùng lịch
scheduleSchema.index(
  {
    doctorId: 1,
    workDate: 1,
    timeSlot: 1,
  },
  {
    unique: true,
  },
);

const scheduleModel =
  mongoose.models.schedule || mongoose.model("schedule", scheduleSchema);

export default scheduleModel;
