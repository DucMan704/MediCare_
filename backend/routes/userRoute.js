import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshToken,
  authMe,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  paymentStripe,
  verifyStripe,
  getMedicalRecords,
  reviewDoctor,
} from "../controllers/userController.js";
import {
  paymentVNPay,
  checkPaymentVNPay,
} from "../controllers/paymentController.js";
import upload from "../middleware/multer.js";
import {authUser } from "../middleware/authUser.js";
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/refresh-token", refreshToken);
userRouter.get("/auth-me", authUser, authMe);

userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile,
);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);
userRouter.post("/payment-razorpay", authUser, paymentRazorpay);
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay);
userRouter.post("/payment-stripe", authUser, paymentStripe);
userRouter.post("/verifyStripe", authUser, verifyStripe);
userRouter.get("/medical-records/:userId", authUser, getMedicalRecords);
userRouter.post("/add-review", authUser, reviewDoctor);

userRouter.post("/create-vnpay-qr", authUser, paymentVNPay);
userRouter.get("/check-payment-vnpay", authUser, checkPaymentVNPay);

export default userRouter;
