import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import axios from "axios";
import { toast } from "react-toastify";
import {
  daysVi,
  translateExperience,
  translateSpeciality,
} from "../utils/i18n";

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, backendUrl, token, getDoctosData } =
    useContext(AppContext);

  const [docInfo, setDocInfo] = useState(false);

  // docSlots[i] = { date: Date, slots: [{ datetime, time }] } cho 7 ngày tới
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");

  const navigate = useNavigate();

  const fetchDocInfo = async () => {
    const docInfo = doctors.find((doc) => doc._id === docId);
    setDocInfo(docInfo);
  };

  const getAvailableSolts = async () => {
    try {
      setDocSlots([]);
      setSlotIndex(0);
      setSlotTime("");

      // Lấy các slot còn trống của bác sĩ trong 7 ngày tới (theo lịch bác sĩ đã cấu hình)
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/slots/${docId}`,
        { params: { days: 7 } },
      );

      if (!data.success) {
        toast.error(data.message || "Không tải được lịch khám");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date();

      const groupedByDay = [];

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(today);
        currentDay.setDate(today.getDate() + i);

        const daySchedules = data.schedules.filter((s) => {
          const d = new Date(s.workDate);
          return (
            d.getFullYear() === currentDay.getFullYear() &&
            d.getMonth() === currentDay.getMonth() &&
            d.getDate() === currentDay.getDate()
          );
        });

        const timeSlots = daySchedules
          .map((s) => {
            const [hour, minute] = s.timeSlot.split(":").map(Number);
            const datetime = new Date(
              currentDay.getFullYear(),
              currentDay.getMonth(),
              currentDay.getDate(),
              hour,
              minute,
              0,
              0,
            );
            return {
              datetime,
              time: s.timeSlot,
              available: s.available,
              isBooked: s.isBooked,
            };
          })
          // Nếu là hôm nay, tự động ẩn các slot đã qua giờ hiện tại
          .filter((slot) => slot.datetime > now)
          .sort((a, b) => a.datetime - b.datetime);

        groupedByDay.push({ date: currentDay, slots: timeSlots });
      }

      setDocSlots(groupedByDay);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || error.message || "Đã có lỗi xảy ra",
      );
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warning("Vui lòng đăng nhập để đặt lịch khám");
      return navigate("/login");
    }

    if (!slotTime) {
      toast.warning("Vui lòng chọn khung giờ khám");
      return;
    }

    const date = docSlots[slotIndex].date;

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    const slotDate = day + "_" + month + "_" + year;

    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/book-appointment",
        { docId, slotDate, slotTime },
        { headers: { token } },
      );
      if (data.success) {
        toast.success(data.message);
        getDoctosData();
        getAvailableSolts();
        navigate("/my-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (doctors.length > 0) {
      fetchDocInfo();
    }
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) {
      getAvailableSolts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docInfo]);

  return docInfo ? (
    <div className="pb-16">
      {/* ---------- Doctor Details ----------- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img
            className="bg-primary w-full sm:max-w-72 rounded-lg"
            src={docInfo.image}
            alt=""
          />
        </div>

        <div className="flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          <p className="flex items-center gap-2 text-3xl font-medium text-gray-700">
            {docInfo.name}{" "}
            <img className="w-5" src={assets.verified_icon} alt="" />
          </p>
          <div className="flex items-center gap-2 mt-1 text-gray-600">
            <p>
              {docInfo.degree} - {translateSpeciality(docInfo.speciality)}
            </p>
            <button className="py-0.5 px-2 border text-xs rounded-full">
              {translateExperience(docInfo.experience)}
            </button>
          </div>

          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-[#262626] mt-3">
              Giới thiệu <img className="w-3" src={assets.info_icon} alt="" />
            </p>
            <p className="text-sm text-gray-600 max-w-[700px] mt-1">
              {docInfo.about}
            </p>
          </div>

          <p className="text-gray-600 font-medium mt-4">
            Phí khám:{" "}
            <span className="text-gray-800">
              {docInfo.fees} {currencySymbol}
            </span>{" "}
          </p>
        </div>
      </div>

      {/* Booking slots */}
      <div className="sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]">
        <p>Chọn khung giờ</p>

        {/* Chọn ngày */}
        <div className="flex gap-3 items-center w-full overflow-x-auto pb-3 mt-4 scrollbar-thin">
          {docSlots.map((day, index) => (
            <div
              onClick={() => {
                setSlotIndex(index);
                setSlotTime("");
              }}
              key={index}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer flex-shrink-0 ${
                slotIndex === index
                  ? "bg-primary text-white"
                  : "border border-[#DDDDDD]"
              }`}
            >
              <p>{daysVi[day.date.getDay()]}</p>
              <p>{day.date.getDate()}</p>
            </div>
          ))}
        </div>

        {/* Chọn giờ */}
        <div className="flex items-center gap-3 w-full overflow-x-auto pb-3 mt-4 scrollbar-thin">
          {docSlots[slotIndex]?.slots.length ? (
            docSlots[slotIndex].slots.map((item, index) => (
              <p
                key={index}
                className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                  item.isBooked || item.available === false
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 opacity-60"
                    : item.time === slotTime
                      ? "bg-primary text-white"
                      : "text-[#949494] border border-[#B4B4B4]"
                }`}
                onClick={() => {
                  if (!item.isBooked && item.available !== false) {
                    setSlotTime(item.time);
                  }
                }}
              >
                {item.time.toLowerCase()}
              </p>
            ))
          ) : (
            <p className="text-sm text-gray-400 py-2">
              Bác sĩ không có lịch khám vào ngày này
            </p>
          )}
        </div>

        <button
          onClick={bookAppointment}
          className="bg-primary text-white text-sm font-light px-20 py-3 rounded-full mt-6 mb-10"
        >
          Đặt lịch khám
        </button>
      </div>

      <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
    </div>
  ) : null;
};

export default Appointment;
