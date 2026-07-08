import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },

    examination: {
      type: String,
      required: true,
    },

    symptoms: [
      {
        type: String,
      },
    ],

    vitalSigns: {
      height: {
        type: Number,
        default: null,
      },

      weight: {
        type: Number,
        default: null,
      },

      bmi: {
        type: Number,
        default: null,
      },

      temperature: {
        type: Number,
        default: null,
      },

      heartRate: {
        type: Number,
        default: null,
      },

      bloodPressure: {
        systolic: {
          type: Number,
          default: null,
        },

        diastolic: {
          type: Number,
          default: null,
        },
      },

      respiratoryRate: {
        type: Number,
        default: null,
      },

      oxygenSaturation: {
        type: Number,
        default: null,
      },
    },

    medicalHistory: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

export default MedicalRecord;
