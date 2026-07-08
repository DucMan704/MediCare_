import React, { useContext, useEffect, useState, useMemo } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const monthNamesVi = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const weekDaysVi = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const defaultTimeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

// Chuyển mảng schedule từ API về object availability theo dateKey
// Hàm thuần (không phụ thuộc context/state) nên có thể để ngoài component
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

  // Thời điểm hiện tại (có giờ/phút), dùng để so sánh với từng slot của HÔM NAY.
  // Cập nhật mỗi phút để các slot tự động mờ đi khi thời gian trôi qua mà không cần reload trang.
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // availability[dateKey] = { available: boolean, slots: { [time]: boolean } }
  const [availability, setAvailability] = useState({});

  const dateKey = (d) =>
    `${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;

  // Gọi API lấy lịch làm việc của bác sĩ trong tháng đang xem
  const fetchAvailability = async (forDate) => {
    try {
      const year = forDate.getFullYear();
      const month = forDate.getMonth();
      const fromDate = new Date(year, month, 1);
      const toDate = new Date(year, month + 1, 0);

      const { data } = await axios.get(
        `${backendUrl}/api/doctor/get-availability`,
        {
          headers: { dToken },
          params: {
            fromDate: fromDate.toISOString(),
            toDate: toDate.toISOString(),
          },
        },
      );

      if (data.success) {
        const mapped = buildAvailabilityFromSchedules(data.schedules || []);
        // Merge thay vì ghi đè toàn bộ, để không mất dữ liệu tháng khác đã load trước đó
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
    setViewDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      return next;
    });
    setSelectedDate(null);
  };

  const changeYear = (offset) => {
    setViewDate((prev) => {
      const next = new Date(prev.getFullYear() + offset, prev.getMonth(), 1);
      return next;
    });
    setSelectedDate(null);
  };

  const goToToday = () => {
    setViewDate(new Date());
    setSelectedDate(null);
  };

  // Sinh danh sách ô ngày để hiển thị full lưới 7 cột (bao gồm ngày tháng trước/sau để lấp đầy tuần)
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Thứ trong JS: 0 = CN ... 6 = T7. Chuyển sang hệ T2 đầu tuần.
    const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7;

    const cells = [];

    // Ngày cuối tháng trước để lấp đầy đầu lưới
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, inCurrentMonth: false });
    }

    // Ngày trong tháng hiện tại
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      cells.push({ date: new Date(year, month, d), inCurrentMonth: true });
    }

    // Ngày đầu tháng sau để lấp đầy cuối lưới (đủ bội số của 7)
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
  const isWeekend = (d) => {
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const isDayAvailable = (d) => {
    const key = dateKey(d);
    return availability[key]?.available ?? false;
  };

  // Kiểm tra 1 khung giờ cụ thể của ngày d đã qua hay chưa.
  // Chỉ có ý nghĩa khi d là hôm nay; các ngày tương lai luôn trả về false.
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
    if (isPast(d)) return;
    if (isSlotPast(d, time)) return;

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

      // B1: Chuẩn bị dữ liệu để gửi lên backend
      // Gửi đủ tất cả slot mặc định, kèm trạng thái available của từng slot.
      // Nếu cả ngày không làm việc -> toàn bộ slot available = false.
      // Nếu là hôm nay và slot đã qua giờ -> luôn gửi false, tránh lưu nhầm slot quá khứ.
      const slotsPayload = defaultTimeSlots.map((time) => {
        const pastSlot = isSlotPast(selectedDate, time);
        return {
          timeSlot: time,
          available: dayAvailable && !pastSlot ? !!daySlots[time] : false,
        };
      });

      const payload = {
        workDate: selectedDate, // Date object, backend sẽ new Date(workDate)
        slots: slotsPayload,
      };

      // B2: Gọi API để lưu dữ liệu
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/update-availability`,
        payload,
        { headers: { dToken } },
      );

      // B3: Xử lý kết quả trả về (thành công hay thất bại)
      if (data.success) {
        // B4: Cập nhật lại state availability nếu cần (giữ nguyên vì đã đúng)
        setAvailability((prev) => ({
          ...prev,
          [key]: { available: dayAvailable, slots: daySlots },
        }));

        // B5: Thông báo cho người dùng
        toast.success(data.message || "Lưu lịch làm việc thành công");
      } else {
        toast.error(data.message || "Lưu lịch làm việc thất bại");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || error.message || "Đã có lỗi xảy ra",
      );
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
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">Lịch làm việc</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ---------- Lịch tháng ---------- */}
        <div className="flex-1 bg-white border rounded-xl shadow-sm p-6">
          {/* Thanh điều hướng */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              <button
                onClick={() => changeYear(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
                title="Năm trước"
              >
                «
              </button>
              <button
                onClick={() => changeMonth(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
                title="Tháng trước"
              >
                ‹
              </button>
            </div>

            <div className="text-center">
              <p className="text-xl font-semibold text-gray-700">
                {monthNamesVi[viewDate.getMonth()]}, {viewDate.getFullYear()}
              </p>
              <button
                onClick={goToToday}
                className="text-xs text-primary hover:underline mt-1"
              >
                Hôm nay
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => changeMonth(1)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
                title="Tháng sau"
              >
                ›
              </button>
              <button
                onClick={() => changeYear(1)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
                title="Năm sau"
              >
                »
              </button>
            </div>
          </div>

          {/* Hàng tên thứ */}
          <div className="grid grid-cols-7 mb-2">
            {weekDaysVi.map((wd, i) => (
              <p
                key={wd}
                className={`text-center text-xs font-semibold ${
                  i >= 5 ? "text-red-400" : "text-gray-500"
                }`}
              >
                {wd}
              </p>
            ))}
          </div>

          {/* Lưới ngày */}
          <div className="grid grid-cols-7 gap-1.5">
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
                    "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-200 select-none",
                    !inCurrentMonth ? "text-gray-300" : "text-gray-700",
                    past
                      ? "opacity-40 cursor-default"
                      : "cursor-pointer hover:bg-primary/10 hover:scale-[1.03]",
                    weekend && inCurrentMonth && !past ? "bg-gray-50" : "",
                    today_
                      ? "border-2 border-primary font-semibold"
                      : "border border-transparent",
                    selected ? "!bg-primary !text-white" : "",
                  ].join(" ")}
                >
                  <span>{date.getDate()}</span>
                  {inCurrentMonth && !past && available && !selected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"></span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chú thích */}
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-primary inline-block"></span>
              Hôm nay
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Có lịch làm việc
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-200 inline-block opacity-60"></span>
              Ngày đã qua
            </div>
          </div>
        </div>

        {/* ---------- Chi tiết ngày được chọn ---------- */}
        <div className="w-full lg:w-80 bg-white border rounded-xl shadow-sm p-6">
          {selectedDate ? (
            <>
              <p className="text-base font-semibold text-gray-700 mb-1">
                {weekDaysVi[(selectedDate.getDay() + 6) % 7]}, ngày{" "}
                {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/
                {selectedDate.getFullYear()}
              </p>

              <div className="flex items-center gap-2 mt-4 mb-5">
                <input
                  type="checkbox"
                  id="day-available"
                  checked={selectedDayAvailable}
                  onChange={() => toggleDayAvailable(selectedDate)}
                />
                <label
                  htmlFor="day-available"
                  className="text-sm text-gray-600"
                >
                  Làm việc trong ngày này
                </label>
              </div>

              {selectedDayAvailable && (
                <>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Chọn khung giờ khả dụng
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                    {defaultTimeSlots.map((time) => {
                      const active = !!selectedSlots[time];
                      const disabled = isSlotPast(selectedDate, time);
                      return (
                        <button
                          key={time}
                          disabled={disabled}
                          onClick={() => toggleSlot(selectedDate, time)}
                          title={disabled ? "Đã qua giờ này" : undefined}
                          className={`text-xs py-2 rounded-full border transition-colors duration-150 ${
                            disabled
                              ? "opacity-40 cursor-not-allowed text-gray-400 border-gray-200 bg-gray-50"
                              : active
                                ? "bg-primary text-white border-primary"
                                : "text-gray-500 border-[#B4B4B4] hover:bg-primary/10"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <button
                onClick={saveAvailability}
                className="w-full mt-6 bg-primary text-white text-sm py-2.5 rounded-full hover:opacity-90 transition-opacity"
              >
                Lưu thay đổi
              </button>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-sm text-gray-400 py-10">
              Chọn một ngày trong lịch <br /> để thiết lập khung giờ làm việc
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
