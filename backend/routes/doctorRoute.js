import express from "express";
import {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentAccept,
  doctorList,
  changeAvailablity,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  updateAvailability,
  getAvailability,
  getDoctorSlots,
  getDoctorReview,
} from "../controllers/doctorController.js";
import {
  getMedicalRecordsByUserId,
  createMedicalRecordForUser,
  updateMedicalRecordForUser,
} from "../controllers/userController.js";
import authDoctor from "../middleware/authDoctor.js";
const doctorRouter = express.Router();

doctorRouter.get("/slots/:docId", getDoctorSlots);
doctorRouter.post("/login", loginDoctor);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.post("/accept-appointment", authDoctor, appointmentAccept);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.get(
  "/medical-records/:userId",
  authDoctor,
  getMedicalRecordsByUserId,
);
doctorRouter.post(
  "/create-medical-records",
  authDoctor,
  createMedicalRecordForUser,
);
doctorRouter.put(
  "/medical-records/:medicalRecordId",
  authDoctor,
  updateMedicalRecordForUser,
);
doctorRouter.get("/list", doctorList);
doctorRouter.post("/change-availability", authDoctor, changeAvailablity);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);
doctorRouter.post("/update-availability", authDoctor, updateAvailability);
doctorRouter.get("/get-availability", authDoctor, getAvailability);
doctorRouter.get("/reviews/:docId", getDoctorReview);

export default doctorRouter;
