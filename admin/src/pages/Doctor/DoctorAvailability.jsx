import React, { useContext, useEffect, useState, useMemo } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { defaultTimeSlots, monthNamesVi, weekDaysVi } from "../../utils/i18n";
// Thêm dòng import này ở đầu file của bạn
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  Clock,
  Save,
  CalendarPlus,
  CheckCircle2,
  Info,
} from "lucide-react";

const buildAvailabilityFromSchedules = (schedules) => {
  const result = {};
  schedules.forEach((item) => {
    const d = new Date(item.workDate);
    const key = `${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
    if (!result[key]) {
      result[key] = { available: false, slots: {} };
    }
    if (item.available) {
      result[key].available = true;
      result[key].slots[item.timeSlot] = true;
    }
  });
  return result;
};

const DoctorAvailability = () => {
  const { dToken } = useContext(DoctorContext);
  const { backendUrl } = useContext(AppContext);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availability, setAvailability] = useState({});

  const dateKey = (d) =>
    `${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;

  const fetchAvailability = async (forDate) => {
    try {
      const year = forDate.getFullYear();
      const month = forDate.getMonth();
      const fromDate = new Date(year, month, 1);
      const toDate = new Date(year, month + 1, 0);

      const { data } = await axios.get(
        `${backendUrl}/api/doctor/get-availability`,
        {
          headers: { dtoken: dToken }, // Nhớ dùng dtoken chữ thường cho chuẩn
          params: {
            fromDate: fromDate.toISOString(),
            toDate: toDate.toISOString(),
          },
        },
      );

      if (data.success) {
        const mapped = buildAvailabilityFromSchedules(data.schedules || []);
        setAvailability((prev) => ({ ...prev, ...mapped }));
      } else {
        toast.error(data.message || "Không tải được lịch làm việc");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || error.message || "Đã có lỗi xảy ra",
      );
    }
  };

  useEffect(() => {
    if (dToken) {
      fetchAvailability(viewDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dToken, viewDate]);

  const changeMonth = (offset) => {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
    setSelectedDate(null);
  };

  const changeYear = (offset) => {
    setViewDate(
      (prev) => new Date(prev.getFullYear() + offset, prev.getMonth(), 1),
    );
    setSelectedDate(null);
  };

  const goToToday = () => {
    setViewDate(new Date());
    setSelectedDate(null);
  };

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const cells = [];

    for (let i = firstWeekday - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month, -i), inCurrentMonth: false });
    }
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      cells.push({ date: new Date(year, month, d), inCurrentMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, inCurrentMonth: false });
    }
    return cells;
  }, [viewDate]);

  const isPast = (d) => d < today;
  const isToday = (d) => d.getTime() === today.getTime();
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

  const isDayAvailable = (d) => {
    const key = dateKey(d);
    return availability[key]?.available ?? false;
  };

  const isSlotPast = (d, time) => {
    if (!isToday(d)) return false;
    const [hour, minute] = time.split(":").map(Number);
    const slotDateTime = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      hour,
      minute,
      0,
      0,
    );
    return slotDateTime <= now;
  };

  const toggleDayAvailable = (d) => {
    if (isPast(d)) return;
    const key = dateKey(d);
    setAvailability((prev) => {
      const current = prev[key] || { available: false, slots: {} };
      return {
        ...prev,
        [key]: { ...current, available: !current.available },
      };
    });
  };

  const toggleSlot = (d, time) => {
    if (isPast(d) || isSlotPast(d, time)) return;
    const key = dateKey(d);
    setAvailability((prev) => {
      const current = prev[key] || { available: true, slots: {} };
      const currentSlots = current.slots || {};
      return {
        ...prev,
        [key]: {
          available: true,
          slots: { ...currentSlots, [time]: !currentSlots[time] },
        },
      };
    });
  };

  // --- TÍNH NĂNG MỚI: Chọn tất cả / Xóa tất cả slot ---
  const handleSelectAllSlots = (d) => {
    if (isPast(d)) return;
    const key = dateKey(d);
    setAvailability((prev) => {
      const allSlots = {};
      defaultTimeSlots.forEach((time) => {
        if (!isSlotPast(d, time)) allSlots[time] = true;
      });
      return { ...prev, [key]: { available: true, slots: allSlots } };
    });
  };

  const handleClearAllSlots = (d) => {
    if (isPast(d)) return;
    const key = dateKey(d);
    setAvailability((prev) => ({
      ...prev,
      [key]: { available: true, slots: {} },
    }));
  };
  // --------------------------------------------------

  const handleSelectDay = (d, inCurrentMonth) => {
    if (isPast(d)) return;
    if (!inCurrentMonth) {
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    setSelectedDate(d);
  };

  const saveAvailability = async () => {
    if (!selectedDate) return;
    try {
      const key = dateKey(selectedDate);
      const dayData = availability[key] || { available: false, slots: {} };
      const dayAvailable = dayData.available;
      const daySlots = dayData.slots || {};

      const slotsPayload = defaultTimeSlots.map((time) => ({
        timeSlot: time,
        available:
          dayAvailable && !isSlotPast(selectedDate, time)
            ? !!daySlots[time]
            : false,
      }));

      const { data } = await axios.post(
        `${backendUrl}/api/doctor/update-availability`,
        { workDate: selectedDate, slots: slotsPayload },
        { headers: { dtoken: dToken } },
      );

      if (data.success) {
        setAvailability((prev) => ({
          ...prev,
          [key]: { available: dayAvailable, slots: daySlots },
        }));
        toast.success(data.message || "Lưu lịch làm việc thành công");
      } else {
        toast.error(data.message || "Lưu lịch làm việc thất bại");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Đã có lỗi xảy ra");
    }
  };

  const selectedKey = selectedDate ? dateKey(selectedDate) : null;
  const selectedSlots = selectedKey
    ? availability[selectedKey]?.slots || {}
    : {};
  const selectedDayAvailable = selectedKey
    ? (availability[selectedKey]?.available ?? false)
    : false;

  return (
    <div className="w-full min-h-screen p-5 md:p-8 bg-[#F8F9FD]">
      <p className="mb-6 text-2xl font-bold text-gray-800">
        Cài đặt lịch làm việc
      </p>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* ---------- Lịch tháng (Trái) ---------- */}
        <div className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8 h-fit">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeYear(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 bg-gray-50 hover:bg-primary hover:text-white transition-all"
                title="Năm trước"
              >
                «
              </button>
              <button
                onClick={() => changeMonth(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 bg-gray-50 hover:bg-primary hover:text-white transition-all"
                title="Tháng trước"
              >
                ‹
              </button>
            </div>

            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 capitalize">
                {monthNamesVi[viewDate.getMonth()]}, {viewDate.getFullYear()}
              </p>
              <button
                onClick={goToToday}
                className="text-sm font-medium text-primary hover:text-blue-700 hover:underline mt-1 transition-colors"
              >
                Trở về Hôm nay
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(1)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 bg-gray-50 hover:bg-primary hover:text-white transition-all"
                title="Tháng sau"
              >
                ›
              </button>
              <button
                onClick={() => changeYear(1)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 bg-gray-50 hover:bg-primary hover:text-white transition-all"
                title="Năm sau"
              >
                »
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4">
            {weekDaysVi.map((wd, i) => (
              <p
                key={wd}
                className={`text-center text-sm font-bold pb-2 border-b ${i >= 5 ? "text-red-400 border-red-100" : "text-gray-400 border-gray-100"}`}
              >
                {wd}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {calendarCells.map(({ date, inCurrentMonth }, idx) => {
              const past = isPast(date);
              const today_ = isToday(date);
              const weekend = isWeekend(date);
              const available = isDayAvailable(date);
              const selected =
                selectedDate && date.getTime() === selectedDate.getTime();

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectDay(date, inCurrentMonth)}
                  className={[
                    "relative aspect-square flex flex-col items-center justify-center rounded-xl text-base transition-all duration-200 select-none border-2",
                    !inCurrentMonth
                      ? "text-gray-300 border-transparent"
                      : "text-gray-700",
                    past
                      ? "opacity-40 cursor-not-allowed border-transparent"
                      : "cursor-pointer hover:border-primary/30 hover:shadow-sm",
                    weekend && inCurrentMonth && !past ? "bg-red-50/30" : "",
                    today_ && !selected
                      ? "border-primary/50 text-primary font-bold bg-blue-50/30"
                      : "border-transparent",
                    selected
                      ? "!bg-primary !border-primary !text-white shadow-md shadow-primary/30 scale-105 z-10"
                      : "bg-white",
                  ].join(" ")}
                >
                  <span className="font-semibold">{date.getDate()}</span>
                  {inCurrentMonth && !past && available && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${selected ? "bg-white" : "bg-primary"}`}
                    ></span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-5 mt-8 px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border-2 border-primary/50 bg-blue-50/30 inline-block"></span>{" "}
              Hôm nay
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>{" "}
              Có lịch làm
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-gray-100 inline-block opacity-60"></span>{" "}
              Đã qua
            </div>
          </div>
        </div>

        {/* ---------- Chi tiết ngày (Phải) ---------- */}
        <div className="w-full xl:w-[400px] bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8 h-fit">
          {selectedDate ? (
            <div className="animate-fade-in">
              <div className="pb-5 border-b border-gray-100">
                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-1">
                  Thiết lập khung giờ
                </p>
                <p className="text-xl font-bold text-gray-800">
                  {weekDaysVi[(selectedDate.getDay() + 6) % 7]}, ngày{" "}
                  {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/
                  {selectedDate.getFullYear()}
                </p>
              </div>

              <div className="flex items-center gap-3 py-6 border-b border-gray-100">
                <div className="relative flex items-start">
                  <input
                    type="checkbox"
                    id="day-available"
                    checked={selectedDayAvailable}
                    onChange={() => toggleDayAvailable(selectedDate)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer mt-0.5"
                  />
                </div>
                <label
                  htmlFor="day-available"
                  className="text-base font-semibold text-gray-700 cursor-pointer select-none"
                >
                  Mở lịch nhận bệnh nhân
                </label>
              </div>

              {selectedDayAvailable && (
                <div className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-gray-600">
                      Chọn giờ khả dụng
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAllSlots(selectedDate)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Chọn hết
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleClearAllSlots(selectedDate)}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        Xóa hết
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {defaultTimeSlots.map((time) => {
                      const active = !!selectedSlots[time];
                      const disabled = isSlotPast(selectedDate, time);
                      return (
                        <button
                          key={time}
                          disabled={disabled}
                          onClick={() => toggleSlot(selectedDate, time)}
                          title={disabled ? "Đã qua giờ này" : undefined}
                          className={`text-sm font-medium py-2.5 rounded-xl border-2 transition-all duration-200 active:scale-95 ${
                            disabled
                              ? "opacity-40 cursor-not-allowed text-gray-400 border-gray-100 bg-gray-50"
                              : active
                                ? "bg-primary/10 text-primary border-primary shadow-sm"
                                : "text-gray-500 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={saveAvailability}
                className="w-full mt-8 bg-primary text-white text-base font-bold py-3.5 rounded-xl shadow-md shadow-primary/30 hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
              >
                Lưu Thay Đổi
              </button>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-4xl">📅</span>
              </div>
              <p className="text-lg font-bold text-gray-500">Chưa chọn ngày</p>
              <p className="text-sm text-gray-400 mt-2 max-w-[200px]">
                Vui lòng chọn một ngày trên lịch để thiết lập ca làm việc.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
