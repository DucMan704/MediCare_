import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import Session from "../models/sessionModel.js";
import crypto from "crypto";
import mongoose from "mongoose";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import scheduleModel from "../models/scheduleModel.js";
import MedicalRecord from "../models/medicalRecordModel.js";
import userMedicalRecordModel from "../models/userMedicalRecordModel.js";
import reviewModel from "../models/reviewModel.js";
import { v2 as cloudinary } from "cloudinary";
import stripe from "stripe";
import razorpay from "razorpay";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

// Gateway Initialize
const stripeInstance = process.env.STRIPE_SECRET_KEY
  ? new stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const razorpayInstance =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // checking for all data to register user
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Details" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email" });
    }

    // checking if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    // validating strong password
    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a strong password" });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error while signing up user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// API to login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Chuẩn hóa email
    const normalizedEmail = email.trim().toLowerCase();

    // Tìm user
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Tạo JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    // tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    //lưu refresh token vào database
    await Session.create({
      ownerId: user._id,
      ownerType: "User",
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL), // 7 ngày
    });
    // Trả refreshtoken về trong cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    // Trả kết quả
    return res.status(200).json({
      success: true,
      message: "Login successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//logout user
const logoutUser = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // xóa refresh token trong db
      await Session.deleteOne({ refreshToken });

      // xóa refresh token trong cookie
      res.clearCookie("refreshToken");
    }

    return res.status(204);
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const authMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
    message: "Authenticated successfully",
  });
};

//refresh token
const refreshToken = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access Denied: No refresh token provided" });
    }

    // so sánh với refresh token trong db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res
        .status(403)
        .json({ message: "Access Denied: Invalid refresh token" });
    }
    // kiểm tra thời gian hết hạn của refresh token
    if (session.expiresAt < new Date()) {
      return res
        .status(403)
        .json({ message: "Access Denied: Refresh token expired" });
    }

    // tạo access token mới
    const newAccessToken = jwt.sign(
      { id: session.userId },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    // trả access token mới về cho client
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const userData = await userModel
      .findById(userId)
      .select("-password")
      .lean();

    res.status(200).json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      // upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.status(200).json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const findDoctorFeeByAppointmentId = async (appointmentId) => {
  try {
    // B1 & B2: Tìm cuộc hẹn và chỉ lấy trường docId
    const appointment = await appointmentModel
      .findById(appointmentId)
      .select("docId")
      .lean();

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // B3 & B4: Tìm bác sĩ và chỉ lấy trường fees
    const doctor = await doctorModel
      .findById(appointment.docId)
      .select("fees")
      .lean();

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    return doctor.fees;
  } catch (error) {
    console.error("Error in findDoctorFeeByAppointmentId:", error.message);
    throw error; // Throw ra ngoài để Controller cấp cao hơn bọc và res.json() lỗi
  }
};

// API to book appointment
const bookAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { docId, slotDate, slotTime } = req.body;

    // khóa atomic cái slot lại
    //  Bác sĩ phải có và đang available, và slotTime chưa nằm trong mảng của slotDate
    const updatedDoctor = await doctorModel
      .findOneAndUpdate(
        {
          _id: docId,
          available: true,
          [`slots_booked.${slotDate}`]: { $ne: slotTime },
        },
        {
          $push: { [`slots_booked.${slotDate}`]: slotTime },
        },
        { new: true, select: "-password", session },
      )
      .lean();

    if (!updatedDoctor) {
      // if update thất bại thif kiểm tra nguyên nhân để trả về lỗi
      const docCheck = await doctorModel.findById(docId).session(session);
      await session.abortTransaction();
      session.endSession();

      if (!docCheck)
        return res
          .status(404)
          .json({ success: false, message: "Doctor not found" });
      if (!docCheck.available)
        return res
          .status(400)
          .json({ success: false, message: "Doctor Not Available" });
      return res.status(400).json({
        success: false,
        message: "Slot Not Available (Double Booking Prevented)",
      });
    }

    const userData = await userModel
      .findById(userId)
      .select("-password")
      .session(session)
      .lean();

    if (!userData) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    delete updatedDoctor.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData: updatedDoctor,
      amount: updatedDoctor.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
  try {
    const userId = req.user._id;
    const appointments = await appointmentModel.find({ userId }).lean();

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel
      .findById(appointmentId)
      .session(session);

    // ktra appointment user
    if (appointmentData.userId.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { cancelled: true },
      { session },
    );

    // releasing doctor slot using atomic $pull operator
    const { docId, slotDate, slotTime } = appointmentData;

    await doctorModel.findByIdAndUpdate(
      docId,
      {
        $pull: { [`slots_booked.${slotDate}`]: slotTime },
      },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
  try {
    if (!razorpayInstance) {
      return res.json({
        success: false,
        message: "Razorpay is not configured",
      });
    }

    if (!process.env.CURRENCY) {
      return res.json({
        success: false,
        message: "Currency is not configured",
      });
    }

    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (
      !appointmentData ||
      appointmentData.cancelled ||
      !appointmentData.isAccepted
    ) {
      return res.json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }

    // creating options for razorpay payment
    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    };

    // creation of an order
    const order = await razorpayInstance.orders.create(options);

    res.json({ success: true, order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
  try {
    if (!razorpayInstance) {
      return res.json({
        success: false,
        message: "Razorpay is not configured",
      });
    }

    const { razorpay_order_id } = req.body;
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    const appointmentData = await appointmentModel.findById(orderInfo.receipt);

    if (
      !appointmentData ||
      !appointmentData.isAccepted ||
      appointmentData.cancelled
    ) {
      return res.json({ success: false, message: "Appointment Not Accepted" });
    }

    if (orderInfo.status === "paid") {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
      });
      res.json({ success: true, message: "Payment Successful" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
  try {
    if (!stripeInstance) {
      return res.json({ success: false, message: "Stripe is not configured" });
    }

    if (!process.env.CURRENCY) {
      return res.json({
        success: false,
        message: "Currency is not configured",
      });
    }

    const { appointmentId } = req.body;
    const { origin } = req.headers;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (
      !appointmentData ||
      appointmentData.cancelled ||
      !appointmentData.isAccepted
    ) {
      return res.json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }

    const currency = process.env.CURRENCY.toLocaleLowerCase();

    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: "Appointment Fees",
          },
          unit_amount: appointmentData.amount * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
      cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
      line_items: line_items,
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyStripe = async (req, res) => {
  try {
    const { appointmentId, success } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (
      !appointmentData ||
      appointmentData.cancelled ||
      !appointmentData.isAccepted
    ) {
      return res.json({ success: false, message: "Appointment Not Accepted" });
    }

    if (success === "true") {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        payment: true,
      });
      return res.json({ success: true, message: "Payment Successful" });
    }

    res.json({ success: false, message: "Payment Failed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getMedicalRecordsByUserId = async (req, res) => {
  const { userId } = req.params;

  const user = await userModel.findById(userId);

  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  const medicalRecords = await userMedicalRecordModel
    .find({ userId })
    .populate({
      path: "medicalRecordId",
      populate: {
        path: "doctorId",
        select: "name speciality image", // chỉ lấy field cần thiết, tránh lộ password
      },
    });

  res.json({ success: true, medicalRecords });
};

const createMedicalRecordForUser = async (req, res) => {
  try {
    const { docId } = req.body;
    const {
      userId,
      examination,
      symptoms,
      medicalHistory,
      height,
      weight,
      bmi,
      temperature,
      heartRate,
      systolic,
      diastolic,
      respiratoryRate,
      oxygenSaturation,
    } = req.body;

    if (!userId || !examination) {
      return res.json({ success: false, message: "Thiếu thông tin hồ sơ" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const parseNumber = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const medicalRecord = await MedicalRecord.create({
      doctorId: docId,
      examination,
      symptoms: Array.isArray(symptoms)
        ? symptoms
        : String(symptoms || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
      medicalHistory: medicalHistory || "",
      vitalSigns: {
        height: parseNumber(height),
        weight: parseNumber(weight),
        bmi: parseNumber(bmi),
        temperature: parseNumber(temperature),
        heartRate: parseNumber(heartRate),
        bloodPressure: {
          systolic: parseNumber(systolic),
          diastolic: parseNumber(diastolic),
        },
        respiratoryRate: parseNumber(respiratoryRate),
        oxygenSaturation: parseNumber(oxygenSaturation),
      },
    });

    const userMedicalRecord = await userMedicalRecordModel.create({
      userId,
      medicalRecordId: medicalRecord._id,
    });

    const createdMedicalRecord = await userMedicalRecordModel
      .findById(userMedicalRecord._id)
      .populate({
        path: "medicalRecordId",
        populate: {
          path: "doctorId",
          select: "name speciality image",
        },
      });

    res.json({
      success: true,
      message: "Đã lưu hồ sơ y tế",
      medicalRecord: createdMedicalRecord,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateMedicalRecordForUser = async (req, res) => {
  try {
    const { docId } = req.body;
    const { medicalRecordId } = req.params;
    const {
      examination,
      symptoms,
      medicalHistory,
      height,
      weight,
      bmi,
      temperature,
      heartRate,
      systolic,
      diastolic,
      respiratoryRate,
      oxygenSaturation,
    } = req.body;

    if (!medicalRecordId || !examination) {
      return res.json({ success: false, message: "Thiếu thông tin hồ sơ" });
    }

    const parseNumber = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const updatedRecord = await MedicalRecord.findOneAndUpdate(
      { _id: medicalRecordId, doctorId: docId },
      {
        examination,
        symptoms: Array.isArray(symptoms)
          ? symptoms
          : String(symptoms || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
        medicalHistory: medicalHistory || "",
        vitalSigns: {
          height: parseNumber(height),
          weight: parseNumber(weight),
          bmi: parseNumber(bmi),
          temperature: parseNumber(temperature),
          heartRate: parseNumber(heartRate),
          bloodPressure: {
            systolic: parseNumber(systolic),
            diastolic: parseNumber(diastolic),
          },
          respiratoryRate: parseNumber(respiratoryRate),
          oxygenSaturation: parseNumber(oxygenSaturation),
        },
      },
      { new: true },
    );

    if (!updatedRecord) {
      return res.json({ success: false, message: "Medical record not found" });
    }

    const userMedicalRecord = await userMedicalRecordModel
      .findOne({ medicalRecordId: updatedRecord._id })
      .populate({
        path: "medicalRecordId",
        populate: {
          path: "doctorId",
          select: "name speciality image",
        },
      });

    res.json({
      success: true,
      message: "Đã cập nhật hồ sơ y tế",
      medicalRecord: userMedicalRecord,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getMedicalRecords = async (req, res) => {
  try {
    // B1: Lấy userId từ params
    const { userId } = req.params;

    // B2: Kiểm tra userId có tồn tại trong cơ sở dữ liệu không
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // B3: Lấy danh sách hồ sơ y tế của người dùng từ bảng userMedicalRecordModel
    const medicalRecords = await userMedicalRecordModel
      .find({ userId })
      .populate({
        path: "medicalRecordId",
        populate: {
          path: "doctorId",
          select: "name speciality image",
        },
      });

    // B4: Trả về danh sách hồ sơ y tế cho người dùng
    return res.json({
      success: true,
      message: "Lấy danh sách hồ sơ y tế thành công",
      medicalRecords,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const reviewDoctor = async (req, res) => {
  try {
    // B1: Lấy thông tin từ body và người dùng đã xác thực
    const { docId, rating, comment } = req.body;
    const userId = req.body.userId;

    // B2: Kiểm tra thông tin bắt buộc — comment là tùy chọn theo schema (default: "")
    if (!docId || !rating) {
      return res.json({
        success: false,
        message: "Vui lòng chọn bác sĩ và số sao đánh giá",
      });
    }

    const numericRating = Number(rating);
    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.json({
        success: false,
        message: "Đánh giá phải là số nguyên từ 1 đến 5 sao",
      });
    }

    // B3: Kiểm tra doctorId có tồn tại trong cơ sở dữ liệu không
    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.json({ success: false, message: "Bác sĩ không tồn tại" });
    }

    // B4: Tạo review mới, hoặc cập nhật nếu bệnh nhân đã đánh giá bác sĩ này trước đó
    const review = await reviewModel.findOneAndUpdate(
      { userId: userId, doctorId: docId },
      { rating: numericRating, comment: comment?.trim() || "" },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // B5: Trả về thông báo thành công
    return res.json({
      success: true,
      message: "Đánh giá bác sĩ thành công",
      review,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

export {
  loginUser,
  registerUser,
  logoutUser,
  refreshToken, 
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  paymentStripe,
  verifyStripe,
  getMedicalRecordsByUserId,
  createMedicalRecordForUser,
  updateMedicalRecordForUser,
  getMedicalRecords,
  reviewDoctor,
  findDoctorFeeByAppointmentId,
};
