import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import scheduleModel from "../models/scheduleModel.js";
import Review from "../models/reviewModel.js";
import Session from "../models/sessionModel.js";
import crypto from "crypto";
import mongoose from "mongoose";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

const parseSlotDate = (slotDate) => {
  const [day, month, year] = slotDate.split("_").map(Number);
  const parsedDate = new Date(year, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const getAppointmentEndTime = (slotDate, slotTime) => {
  const [day, month, year] = slotDate.split("_").map(Number);
  const [hours, minutes] = slotTime.split(":").map(Number);
  const appointmentDateTime = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0,
  );
  appointmentDateTime.setMinutes(appointmentDateTime.getMinutes() + 30);
  return appointmentDateTime;
};

const syncOverdueAppointments = async (docId) => {
  const now = new Date();

  const overdueAppointments = await appointmentModel.find({
    docId,
    cancelled: false,
    isAccepted: true,
    isCompleted: false,
  });

  const overdueIds = overdueAppointments
    .filter(
      (appointment) =>
        now >=
        getAppointmentEndTime(appointment.slotDate, appointment.slotTime),
    )
    .map((appointment) => appointment._id);

  if (overdueIds.length > 0) {
    await appointmentModel.updateMany(
      { _id: { $in: overdueIds } },
      { $set: { isCompleted: true } },
    );
  }
};

// API for doctor Login
const loginDoctor = async (req, res) => {
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
    const doctor = await doctorModel.findOne({ email: normalizedEmail });

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, doctor.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Tạo JWT
    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    // tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    //lưu refresh token vào database
    await Session.create({
      ownerId: doctor._id,
      ownerType: "Doctor",
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
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.doctor._id;
    await syncOverdueAppointments(docId);
    const appointments = await appointmentModel.find({ docId }).lean();

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to accept appointment for doctor panel
const appointmentAccept = async (req, res) => {
  try {
    const docId = req.doctor._id;
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (
      appointmentData &&
      appointmentData.docId === docId &&
      !appointmentData.cancelled
    ) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isAccepted: true,
      });

      await scheduleModel.findOneAndUpdate(
        {
          doctorId: docId,
          workDate: parseSlotDate(appointmentData.slotDate),
          timeSlot: appointmentData.slotTime,
        },
        {
          $set: {
            isBooked: true,
            appointmentId: appointmentData._id,
          },
        },
        { upsert: true },
      );

      return res
        .status(200)
        .json({ success: true, message: "Appointment Accepted" });
    }

    res.status(404).json({ success: false, message: "Appointment Not Found" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel
      .find({})
      .select(["-password", "-email"])
      .lean();
    res.status(200).json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
  try {
    const docId = req.doctor ? req.doctor._id : req.body.docId;

    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.status(200).json({ success: true, message: "Availablity Changed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
  try {
    const docId = req.doctor._id;
    const profileData = await doctorModel
      .findById(docId)
      .select("-password")
      .lean();

    res.status(200).json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.doctor._id;
    const { fees, address, available } = req.body;

    await doctorModel.findByIdAndUpdate(docId, { fees, address, available });

    res.status(200).json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const docId = req.doctor._id;

    await syncOverdueAppointments(docId);

    const appointments = await appointmentModel.find({ docId }).lean();

    let earnings = 0;

    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    let patients = [];

    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse(),
    };

    res.status(200).json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to update doctor availability (schedule) for Doctor Panel
const updateAvailability = async (req, res) => {
  try {
    const docId = req.doctor._id;
    const { workDate, slots } = req.body;

    if (!workDate || !Array.isArray(slots) || slots.length === 0) {
      return res.json({ success: false, message: "Dữ liệu không hợp lệ" });
    }

    // Chuẩn hóa ngày về 00:00:00 để tránh lệch giờ khi so sánh/lưu
    const normalizedDate = new Date(workDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // Không cho phép sửa các slot đã có bệnh nhân đặt (isBooked = true)
    const bookedSlots = await scheduleModel
      .find({
        doctorId: docId,
        workDate: normalizedDate,
        timeSlot: { $in: slots.map((s) => s.timeSlot) },
        isBooked: true,
      })
      .select("timeSlot");

    const bookedTimeSlots = new Set(bookedSlots.map((s) => s.timeSlot));

    const editableSlots = slots.filter((s) => !bookedTimeSlots.has(s.timeSlot));

    if (editableSlots.length > 0) {
      const ops = editableSlots.map(({ timeSlot, available }) => ({
        updateOne: {
          filter: { doctorId: docId, workDate: normalizedDate, timeSlot },
          update: {
            $set: {
              available,
              doctorId: docId,
              workDate: normalizedDate,
              timeSlot,
            },
          },
          upsert: true,
        },
      }));

      await scheduleModel.bulkWrite(ops);
    }

    const skippedCount = slots.length - editableSlots.length;

    res.json({
      success: true,
      message:
        skippedCount > 0
          ? `Cập nhật lịch làm việc thành công (bỏ qua ${skippedCount} khung giờ đã có bệnh nhân đặt)`
          : "Cập nhật lịch làm việc thành công",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get doctor's schedule (availability) within a date range for Doctor Panel
const getAvailability = async (req, res) => {
  try {
    const docId = req.doctor._id;
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.json({ success: false, message: "Thiếu khoảng ngày cần tải" });
    }

    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const schedules = await scheduleModel
      .find({
        doctorId: docId,
        workDate: { $gte: from, $lte: to },
      })
      .select("workDate timeSlot available isBooked");

    res.status(200).json({ success: true, schedules });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get doctor's available slots for booking (public, for patient side)
const getDoctorSlots = async (req, res) => {
  try {
    const { docId } = req.params;
    const days = parseInt(req.query.days) || 7;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days - 1);
    endDate.setHours(23, 59, 59, 999);

    const schedules = await scheduleModel
      .find({
        doctorId: docId,
        workDate: { $gte: today, $lte: endDate },
      })
      .select("workDate timeSlot available isBooked")
      .sort({ workDate: 1, timeSlot: 1 });

    res.status(200).json({ success: true, schedules });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDoctorReview = async (req, res) => {
  try {
    // B1: Lấy docId từ params
    const { docId } = req.params;

    // B2: Tìm tất cả review của bác sĩ đó, sắp xếp theo createdAt giảm dần,
    // populate userId để lấy name và image
    const reviews = await Review.find({ doctorId: docId })
      .sort({ createdAt: -1 })
      .populate("userId", "name image");

    // B3: Trả về danh sách review
    return res.json({ success: true, reviews });
  } catch (error) {
    // B4: Xử lý lỗi
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const appointmentComplete = async (req, res) => {
  try {
    const docId = req.doctor._id;
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.docId !== docId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized action",
      });
    }

    if (appointment.cancelled) {
      return res.status(400).json({
        success: false,
        message: "Appointment has been cancelled",
      });
    }

    if (appointment.isCompleted) {
      return res.status(400).json({
        success: false,
        message: "Appointment already completed",
      });
    }

    appointment.isCompleted = true;
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment completed successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const appointmentCancel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const docId = req.doctor._id;
    const { appointmentId } = req.body;

    //  Kiểm tra lịch khám
    const appointment = await appointmentModel
      .findById(appointmentId)
      .session(session);

    if (!appointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    //  Kiểm tra bác sĩ có quyền hủy k
    if (appointment.docId !== docId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: "Unauthorized action",
      });
    }

    //  Đã hủy rồi
    if (appointment.cancelled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Appointment already cancelled",
      });
    }

    // cuộc hẹn đã hoàn thành thì không được hủy
    if (appointment.isCompleted) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Completed appointment cannot be cancelled",
      });
    }

    appointment.cancelled = true;
    await appointment.save({ session });

    // xóa slot đã hẹn
    await doctorModel.findByIdAndUpdate(
      docId,
      {
        $pull: {
          [`slots_booked.${appointment.slotDate}`]: appointment.slotTime,
        },
      },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentAccept,
  getDoctorSlots,
  doctorList,
  changeAvailablity,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  updateAvailability,
  getAvailability,
  getDoctorReview,
};
