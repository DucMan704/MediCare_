import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    speciality: {
      type: String,
      required: true,
    },

    degree: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      required: true,
    },

    about: {
      type: String,
      required: true,
    },

    available: {
      type: Boolean,
      default: true,
    },

    fees: {
      type: Number,
      required: true,
      min: 0,
    },

    slots_booked: {
      type: Object,
      default: {},
    },

    address: {
      type: Object,
      required: true,
    },

    date: {
      type: Number,
      required: true,
    },
  },
  {
    minimize: false,
    timestamps: true,
  },
);

const doctorModel =
  mongoose.models.doctor || mongoose.model("doctor", doctorSchema, "doctors");

export default doctorModel;
