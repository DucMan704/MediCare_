import mongoose from "mongoose";

const userMedicalRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    medicalRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalRecord",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Một user không được liên kết trùng với cùng một hồ sơ
userMedicalRecordSchema.index(
  { userId: 1, medicalRecordId: 1 },
  { unique: true },
);

const UserMedicalRecord = mongoose.model(
  "UserMedicalRecord",
  userMedicalRecordSchema,
);

export default UserMedicalRecord;
