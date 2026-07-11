import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";
import userMedicalRecordModel from "../models/userMedicalRecordModel.js";
import medicalRecordModel from "../models/medicalRecordModel.js";

// API for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({}).lean();
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentCancel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel
      .findById(appointmentId)
      .session(session);

    if (!appointmentData) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    await appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        cancelled: true,
      },
      { session },
    );

    // xóa slot của bác sĩ
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// API for adding Doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    // checking for all data to add doctor
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // validating strong password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();
    res.json({ success: true, message: "Doctor Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password").lean();
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).lean();
    const users = await userModel.find({}).lean();
    const appointments = await appointmentModel.find({}).lean();

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse(),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete doctor
const deleteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const doctor = await doctorModel.findById(doctorId);

    if (!doctor) {
      return res.json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Xóa tất cả lịch hẹn của bác sĩ (nếu muốn)
    await appointmentModel.deleteMany({ docId: doctorId });

    // Xóa bác sĩ
    await doctorModel.findByIdAndDelete(doctorId);

    res.json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// API to edit/update doctor
const editDoctor = async (req, res) => {
  try {
    const {
      doctorId,
      name,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    if (!doctorId) {
      return res.json({ success: false, message: "Missing doctorId" });
    }

    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (speciality) updateData.speciality = speciality;
    if (degree) updateData.degree = degree;
    if (experience) updateData.experience = experience;
    if (about) updateData.about = about;
    if (fees) updateData.fees = fees;
    if (address) updateData.address = JSON.parse(address);

    // Nếu có upload ảnh mới thì upload lên cloudinary và cập nhật
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      updateData.image = imageUpload.secure_url;
    }

    await doctorModel.findByIdAndUpdate(doctorId, updateData);

    res.json({ success: true, message: "Doctor Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get single doctor by ID (dùng để load dữ liệu vào form Edit)
const getDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.json({ success: false, message: "Missing doctorId" });
    }

    const doctor = await doctorModel.findById(doctorId).select("-password");

    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/**
 * API: Lấy danh sách toàn bộ bệnh nhân hệ thống
 * Route: GET /api/admin/patients
 * Access: Admin Private (Bọc qua middleware authAdmin)
 */
export const getAllPatients = async (req, res) => {
  try {
    // Chỉ lấy các trường thông tin cần thiết hiển thị trên bảng, dùng lean() để tối ưu tốc độ
    const patients = await userModel
      .find({})
      .select("name email phone image gender dob createdAt address")
      .sort({ createdAt: -1 }) // Sắp xếp tài khoản mới đăng ký lên đầu
      .lean();

    return res.status(200).json({
      success: true,
      patients,
    });
  } catch (error) {
    console.error("Error in getAllPatients:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * API: Lấy toàn bộ lịch sử cuộc hẹn của một bệnh nhân cụ thể
 * Route: GET /api/admin/patient-appointments/:userId
 * Access: Admin Private (Bọc qua middleware authAdmin)
 */
const getPatientAppointments = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId parameter",
      });
    }

    // Tìm toàn bộ cuộc hẹn của user này, đồng thời populate lấy thông tin bác sĩ phụ trách
    const appointments = await appointmentModel
      .find({ userId })
      .select("slotDate slotTime cancelled isCompleted payment docData")
      .populate({
        path: "docId",
        select: "name speciality image", // Đổ dữ liệu bác sĩ vào phòng trường hợp docData thô bị thiếu
      })
      .sort({ slotDate: -1, slotTime: -1 }) // Lịch hẹn gần nhất lên trước
      .lean();

    // Map lại dữ liệu để đảm bảo cấu trúc frontend nhận vào luôn có docData ổn định
    const formattedAppointments = appointments.map((app) => ({
      ...app,
      docData: app.docData || {
        name: app.docId?.name || "Bác sĩ đã ẩn khỏi hệ thống",
        speciality: app.docId?.speciality || "N/A",
        image: app.docId?.image || "",
      },
    }));

    return res.status(200).json({
      success: true,
      appointments: formattedAppointments,
    });
  } catch (error) {
    console.error("Error in getPatientAppointments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
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

const updatePatientProfileByAdmin = async (req, res) => {
  try {
    const { userId, name, phone, gender, dob, address } = req.body;

    const updateData = {
      name,
      phone,
      gender,
      dob,
      address: JSON.parse(address),
    };

    if (req.file) {
      updateData.image = req.file.path; // Đường dẫn ảnh từ Multer Cloudinary
    }

    const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bệnh nhân" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Cập nhật hồ sơ bệnh nhân thành công!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const patientDelete = async (req, res) => {
  //B1: Lấy userId từ body
  const { userId } = req.body;

  //B2: Kiểm tra userId có tồn tại trong cơ sở dữ liệu không
  const user = await userModel.findById(userId);
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy bệnh nhân" });
  }

  //B3: Xóa user khỏi cơ sở dữ liệu
  await userModel.findByIdAndDelete(userId);

  //B4: Trả về thông báo thành công hoặc thất bại
  return res
    .status(200)
    .json({ success: true, message: "Xóa bệnh nhân thành công!" });
};

export {
  loginAdmin,
  appointmentsAdmin,
  appointmentCancel,
  getMedicalRecords,
  addDoctor,
  allDoctors,
  adminDashboard,
  deleteDoctor,
  editDoctor,
  getDoctorById,
  getPatientAppointments,
  updatePatientProfileByAdmin,
  patientDelete,
};
