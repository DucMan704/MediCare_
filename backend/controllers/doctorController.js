import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import scheduleModel from "../models/scheduleModel.js";

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
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await doctorModel
      .findOne({ email: normalizedEmail })
      .collation({ locale: "en", strength: 2 });

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isHashedPassword = user.password?.startsWith("$2");
    const isMatch = isHashedPassword
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (isMatch) {
      if (!isHashedPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await doctorModel.findByIdAndUpdate(user._id, {
          password: hashedPassword,
        });
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    await syncOverdueAppointments(docId);
    const appointments = await appointmentModel.find({ docId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });

      await scheduleModel.findOneAndUpdate(
        {
          doctorId: docId,
          workDate: parseSlotDate(appointmentData.slotDate),
          timeSlot: appointmentData.slotTime,
        },
        {
          $set: {
            isBooked: false,
            appointmentId: null,
          },
        },
      );

      return res.json({ success: true, message: "Appointment Cancelled" });
    }

    res.json({ success: false, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to accept appointment for doctor panel
const appointmentAccept = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

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

      return res.json({ success: true, message: "Appointment Accepted" });
    }

    res.json({ success: false, message: "Appointment Not Found" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isAccepted: true,
        isCompleted: true,
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

      return res.json({ success: true, message: "Appointment Completed" });
    }

    res.json({ success: false, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
  try {
    const { docId } = req.body;

    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.json({ success: true, message: "Availablity Changed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel.findById(docId).select("-password");

    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fees, address, available } = req.body;

    await doctorModel.findByIdAndUpdate(docId, { fees, address, available });

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;

    await syncOverdueAppointments(docId);

    const appointments = await appointmentModel.find({ docId });

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

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update doctor availability (schedule) for Doctor Panel
const updateAvailability = async (req, res) => {
  try {
    const { docId, workDate, slots } = req.body;

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
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor's schedule (availability) within a date range for Doctor Panel
const getAvailability = async (req, res) => {
  try {
    const { docId } = req.body; // gán từ middleware authDoctor
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

    res.json({ success: true, schedules });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
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

    res.json({ success: true, schedules });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
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
};
