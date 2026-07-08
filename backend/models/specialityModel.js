import mongoose from "mongoose";

const specialtySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const specialtyModel =
  mongoose.models.specialty ||
  mongoose.model("specialty", specialtySchema, "specialties");

export default specialtyModel;
