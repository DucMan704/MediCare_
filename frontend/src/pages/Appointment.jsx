import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { Star, MessageCircle, Loader2, Send, UserRound } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Renders 5 stars with a partial fill based on `value` (0–5, decimals ok).
const StarRating = ({ value = 0, size = 16 }) => {
  const percent = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <div className="relative inline-flex leading-none">
      <div className="flex gap-0.5 text-gray-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} fill="currentColor" stroke="none" />
        ))}
      </div>
      <div
        className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber-400"
        style={{ width: `${percent}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} fill="currentColor" stroke="none" />
        ))}
      </div>
    </div>
  );
};

// Clickable 1–5 star selector for the "write a review" form.
const StarSelector = ({ value, onChange, size = 24 }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="text-amber-400 transition-transform hover:scale-110"
        >
          <Star
            size={size}
            fill={(hovered || value) >= n ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
};

const formatReviewDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, backendUrl, token, getDoctosData } =
    useContext(AppContext);

  const [docInfo, setDocInfo] = useState(false);

  // docSlots[i] = { date: Date, slots: [{ datetime, time }] } cho 7 ngày tới
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const navigate = useNavigate();

  const fetchDocInfo = async () => {
    const docInfo = doctors.find((doc) => doc._id === docId);
    setDocInfo(docInfo);
  };

  const getAvailableSlots = async () => {
    try {
      setDocSlots([]);
      setSlotIndex(0);
      setSlotTime("");

      // 1. Gọi API lấy lịch cấu hình của bác sĩ
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/slots/${docId}`,
        { params: { days: 7 } },
      );

      if (!data.success) {
        toast.error(data.message || "Không tải được lịch khám");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Mốc 00:00:00 hôm nay để tính tịnh tiến 7 ngày
      const now = new Date(); // Thời gian thực tại để check giờ quá khứ

      const groupedByDay = [];

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(today);
        currentDay.setDate(today.getDate() + i);

        // Tạo chuỗi định dạng ngày chuẩn "DD_MM_YYYY" để đồng bộ với DB (Ví dụ: 26_06_2026)
        const formattedDay = String(currentDay.getDate()).padStart(2, "0");
        const formattedMonth = String(currentDay.getMonth() + 1).padStart(
          2,
          "0",
        );
        const backendSlotDate = `${formattedDay}_${formattedMonth}_${currentDay.getFullYear()}`;

        // Lọc các lịch thuộc ngày đang xét
        const daySchedules = data.schedules.filter((s) => {
          const d = new Date(s.workDate);
          return (
            d.getFullYear() === currentDay.getFullYear() &&
            d.getMonth() === currentDay.getMonth() &&
            d.getDate() === currentDay.getDate()
          );
        });

        let timeSlots = daySchedules.map((s) => {
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
            backendSlotDate, // Đút kèm chuỗi format sẵn vào đây để Frontend click là lấy xài luôn
          };
        });

        // BẢO VỆ LOGIC: Chỉ áp dụng lọc bỏ giờ quá khứ NẾU ĐÂY LÀ NGÀY HÔM NAY (i === 0)
        if (i === 0) {
          timeSlots = timeSlots.filter((slot) => slot.datetime > now);
        }

        // Sắp xếp tăng dần theo giờ
        timeSlots.sort((a, b) => a.datetime - b.datetime);

        groupedByDay.push({
          date: currentDay,
          backendSlotDate,
          slots: timeSlots,
        });
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

    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(month).padStart(2, "0"); // month = getMonth() + 1

    const slotDate = `${formattedDay}_${formattedMonth}_${year}`;

    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/book-appointment",
        { docId, slotDate, slotTime },
        { headers: { token } },
      );
      if (data.success) {
        toast.success(data.message);
        getDoctosData();
        getAvailableSlots();
        navigate("/my-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  /* -------------------------------------------------------------- */
  /* Reviews — GET /api/doctor/reviews/:docId                        */
  /* (adjust the path if your route differs; expects                */
  /* { success, reviews: [{ _id, rating, comment, createdAt,        */
  /*   patientId: { name, image } }] })                              */
  /* -------------------------------------------------------------- */
  const getDoctorReviews = async () => {
    try {
      setReviewsLoading(true);

      const { data } = await axios.get(
        `${backendUrl}/api/doctor/reviews/${docId}`,
      );

      console.log("API Response:", data);

      if (data.success) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.log(error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.warning("Vui lòng đăng nhập để đánh giá bác sĩ");
      return navigate("/login");
    }

    if (!reviewForm.rating) {
      toast.warning("Vui lòng chọn số sao đánh giá");
      return;
    }

    try {
      setSubmittingReview(true);
      const { data } = await axios.post(
        backendUrl + "/api/user/add-review",
        { docId, rating: reviewForm.rating, comment: reviewForm.comment },
        { headers: { token } },
      );

      if (data.success) {
        toast.success(data.message || "Cảm ơn bạn đã đánh giá!");
        setReviewForm({ rating: 0, comment: "" });
        setShowReviewForm(false);
        getDoctorReviews();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (doctors.length > 0) {
      fetchDocInfo();
    }
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) {
      getAvailableSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docInfo]);

  useEffect(() => {
    getDoctorReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const { averageRating, totalReviews, distribution } = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = total ? sum / total : 0;

    const dist = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length;
      return {
        star,
        count,
        percent: total ? (count / total) * 100 : 0,
      };
    });

    return { averageRating: avg, totalReviews: total, distribution: dist };
  }, [reviews]);

  return docInfo ? (
    <div className="mx-auto max-w-4xl pb-16">
      {/* ---------- Doctor Details ----------- */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div>
          <img
            className="w-full rounded-2xl bg-primary shadow-sm sm:max-w-72"
            src={docInfo.image}
            alt=""
          />
        </div>

        <div className="mx-2 mt-[-80px] flex-1 rounded-2xl border border-gray-100 bg-white p-6 py-7 shadow-sm sm:mx-0 sm:mt-0 sm:p-8">
          <p className="flex flex-wrap items-center gap-2 text-2xl font-semibold text-gray-800 sm:text-3xl">
            {docInfo.name}
            <img className="w-5" src={assets.verified_icon} alt="" />
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-gray-600">
            <p>
              {docInfo.degree} - {translateSpeciality(docInfo.speciality)}
            </p>
            <button className="rounded-full border px-2 py-0.5 text-xs">
              {translateExperience(docInfo.experience)}
            </button>
          </div>

          {/* Rating summary */}
          <div className="mt-3 flex items-center gap-2">
            <StarRating value={averageRating} size={16} />
            <span className="text-sm font-semibold text-gray-700">
              {totalReviews ? averageRating.toFixed(1) : "Chưa có đánh giá"}
            </span>
            {totalReviews > 0 && (
              <span className="text-xs text-gray-400">
                ({totalReviews} đánh giá)
              </span>
            )}
          </div>

          <div>
            <p className="mt-4 flex items-center gap-1 text-sm font-medium text-[#262626]">
              Giới thiệu <img className="w-3" src={assets.info_icon} alt="" />
            </p>
            <p className="mt-1 max-w-[700px] text-sm text-gray-600">
              {docInfo.about}
            </p>
          </div>

          <p className="mt-4 font-medium text-gray-600">
            Phí khám:{" "}
            <span className="text-gray-800">
              {docInfo.fees} {currencySymbol}
            </span>
          </p>
        </div>
      </div>

      {/* Booking slots */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 font-medium text-[#565656] shadow-sm sm:p-6">
        <p>Chọn khung giờ</p>

        {/* Chọn ngày */}
        <div className="scrollbar-thin mt-4 flex w-full items-center gap-3 overflow-x-auto pb-3">
          {docSlots.map((day, index) => (
            <div
              onClick={() => {
                setSlotIndex(index);
                setSlotTime("");
              }}
              key={index}
              className={`flex-shrink-0 min-w-16 cursor-pointer rounded-2xl py-6 text-center transition-colors ${
                slotIndex === index
                  ? "bg-primary text-white"
                  : "border border-[#DDDDDD] hover:border-primary"
              }`}
            >
              <p>{daysVi[day.date.getDay()]}</p>
              <p>{day.date.getDate()}</p>
            </div>
          ))}
        </div>

        {/* Chọn giờ */}
        <div className="scrollbar-thin mt-4 flex w-full items-center gap-3 overflow-x-auto pb-3">
          {docSlots[slotIndex]?.slots.length ? (
            docSlots[slotIndex].slots.map((item, index) => (
              <p
                key={index}
                className={`flex-shrink-0 cursor-pointer rounded-full px-5 py-2 text-sm font-light ${
                  item.isBooked || item.available === false
                    ? "cursor-not-allowed border border-gray-300 bg-gray-200 text-gray-400 opacity-60"
                    : item.time === slotTime
                      ? "bg-primary text-white"
                      : "border border-[#B4B4B4] text-[#949494] hover:border-primary"
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
            <p className="py-2 text-sm text-gray-400">
              Bác sĩ không có lịch khám vào ngày này
            </p>
          )}
        </div>

        <button
          onClick={bookAppointment}
          className="mt-6 rounded-full bg-primary px-20 py-3 text-sm font-light text-white transition-opacity hover:opacity-90"
        >
          Đặt lịch khám
        </button>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Reviews & comments                                          */}
      {/* ---------------------------------------------------------- */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <MessageCircle size={18} className="text-primary" />
            Đánh giá từ bệnh nhân
          </p>
          <button
            onClick={() => setShowReviewForm((prev) => !prev)}
            className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-white"
          >
            Viết đánh giá
          </button>
        </div>

        {/* Summary: average + distribution */}
        {totalReviews > 0 && (
          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center gap-1 sm:w-32">
              <p className="text-4xl font-semibold text-gray-800">
                {averageRating.toFixed(1)}
              </p>
              <StarRating value={averageRating} size={16} />
              <p className="text-xs text-gray-400">{totalReviews} đánh giá</p>
            </div>

            <div className="flex-1 space-y-1.5">
              {distribution.map((row) => (
                <div key={row.star} className="flex items-center gap-2">
                  <span className="w-8 text-xs text-gray-500">
                    {row.star} sao
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-gray-400">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Write a review form */}
        {showReviewForm && (
          <form
            onSubmit={submitReview}
            className="mt-5 flex flex-col gap-3 rounded-2xl bg-gray-50 p-4"
          >
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                Đánh giá của bạn
              </p>
              <StarSelector
                value={reviewForm.rating}
                onChange={(rating) =>
                  setReviewForm((prev) => ({ ...prev, rating }))
                }
              />
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
              }
              maxLength={1000}
              rows={3}
              placeholder="Chia sẻ trải nghiệm khám bệnh của bạn..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="rounded-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submittingReview ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Gửi đánh giá
              </button>
            </div>
          </form>
        )}

        {/* Review list */}
        <div className="mt-6 flex flex-col divide-y divide-gray-100">
          {reviewsLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Đang tải đánh giá...
            </div>
          ) : reviews.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Chưa có đánh giá nào cho bác sĩ này. Hãy là người đầu tiên chia sẻ
              trải nghiệm của bạn!
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="flex gap-3 py-4">
                {review.userId?.image ? (
                  <img
                    src={review.userId.image}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <UserRound size={18} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="text-sm font-medium text-gray-800">
                      {review.userId?.name || "Bệnh nhân ẩn danh"}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatReviewDate(review.createdAt)}
                    </span>
                  </div>
                  <StarRating value={review.rating} size={13} />
                  {review.comment && (
                    <p className="mt-1.5 text-sm text-gray-600">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
    </div>
  ) : null;
};

export default Appointment;
