import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { translateExperience } from "../../utils/i18n";

/* ---------- Icon set (inline SVG, no extra dependency) ---------- */

const IconPencil = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconCheck = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconX = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const IconMapPin = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconWallet = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
    <path d="M21 12h-4a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const IconClock = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const IconLoader = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    className="animate-spin"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-9-9" />
  </svg>
);

const IconBadge = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="8" r="5" />
    <path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" />
  </svg>
);

const IconStarFilled = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
  </svg>
);

/* A row of 5 stars, partially filled based on `value` (0–5, decimals ok). */
const StarRow = ({ value = 0, size = 14 }) => {
  // Đảm bảo giá trị truyền vào luôn nằm trong khoảng [0, 5]
  const validatedValue = Math.max(0, Math.min(5, value));

  return (
    <div className="flex gap-0.5 leading-none text-gray-200">
      {Array.from({ length: 5 }).map((_, i) => {
        // Mức độ lấp đầy của ngôi sao hiện tại (từ 0 đến 1)
        // Ví dụ: value = 4.5 thì các sao i=0,1,2,3 sẽ ra 1 (100%). Sao i=4 sẽ ra 0.5 (50%)
        const activeWidth = Math.max(0, Math.min(1, validatedValue - i)) * 100;

        return (
          <div
            key={i}
            className="relative inline-block"
            style={{ width: size, height: size }}
          >
            {/* Lớp nền màu xám (Sao trống) */}
            <IconStarFilled style={{ width: size, height: size }} />

            {/* Lớp phủ màu vàng (Sao đầy / đầy một phần) */}
            {activeWidth > 0 && (
              <div
                className="absolute top-0 left-0 h-full overflow-hidden text-[#E0A93B]"
                style={{ width: `${activeWidth}%` }}
              >
                {/* Ép icon bên trong luôn giữ kích thước chuẩn (size) 
                    để không bị bóp méo khi thẻ div cha bị div cha cắt bớt width */}
                <div style={{ width: size, height: size }}>
                  <IconStarFilled style={{ width: size, height: size }} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const ProfileSkeleton = () => (
  <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#FFFFFF]">
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-44 rounded-2xl bg-[#E3E7E1]" />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 -mt-6 relative z-10 px-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-white border border-[#E3E7E1]"
          />
        ))}
      </div>
      <div className="mt-8 h-72 rounded-2xl bg-white border border-[#E3E7E1]" />
    </div>
  </div>
);

const DoctorProfile = () => {
  const { dToken, profileData, setProfileData, getProfileData } =
    useContext(DoctorContext);
  const { currency, backendUrl } = useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  // Rating summary — GET /api/doctor/reviews/:docId (same endpoint the
  // patient-facing Appointment page uses), averaged on the client.
  const [ratingSummary, setRatingSummary] = useState({ average: 0, total: 0 });
  const [ratingLoading, setRatingLoading] = useState(true);

  const startEdit = () => {
    setSnapshot(profileData);
    setIsEdit(true);
  };

  const cancelEdit = () => {
    if (snapshot) setProfileData(snapshot);
    setIsEdit(false);
  };

  const updateProfile = async () => {
    if (Number(profileData.fees) < 0) {
      toast.error("Phí khám không thể là số âm");
      return;
    }
    if (!profileData.address.line1?.trim()) {
      toast.error("Vui lòng nhập địa chỉ");
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        address: profileData.address,
        fees: profileData.fees,
        about: profileData.about,
        available: profileData.available,
      };

      const { data } = await axios.post(
        backendUrl + "/api/doctor/update-profile",
        updateData,
        { headers: { dToken } },
      );

      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken]);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!profileData?._id) return;
      try {
        setRatingLoading(true);
        const { data } = await axios.get(
          `${backendUrl}/api/doctor/reviews/${profileData._id}`,
        );
        if (data.success) {
          const total = data.reviews.length;
          const average = total
            ? data.reviews.reduce((sum, r) => sum + r.rating, 0) / total
            : 0;
          setRatingSummary({ average, total });
        }
      } catch (error) {
        console.log(error);
      } finally {
        setRatingLoading(false);
      }
    };

    fetchRatings();
  }, [profileData?._id, backendUrl]);

  if (!profileData) return <ProfileSkeleton />;

  const available = profileData.available;

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#FFFFFF]">
      <div className="max-w-4xl mx-auto">
        {/* ---------- Header banner ---------- */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br bg-primary px-6 py-8 sm:px-10 sm:py-10">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 85% 20%, white 0, transparent 45%), radial-gradient(circle at 10% 90%, white 0, transparent 40%)",
            }}
          />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative shrink-0">
              <div
                className={`rounded-full p-1.5 ${
                  available
                    ? "ring-4 ring-[#FFFFFF]/70"
                    : "ring-4 ring-white/20"
                }`}
              >
                <img
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-white/20 bg-white/10"
                  src={profileData.image}
                  alt={profileData.name}
                />
              </div>
              <span
                className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${
                  available ? "bg-[#2F9E6E]" : "bg-gray-400"
                }`}
              >
                {available && (
                  <span className="absolute inset-0 rounded-full bg-[#2F9E6E] animate-ping opacity-75" />
                )}
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left text-white">
              <p className="font-serif text-3xl sm:text-4xl tracking-tight">
                {profileData.name}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2 text-teal-50/85 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <IconBadge className="w-4 h-4" />
                  {profileData.degree} · {profileData.speciality}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  {translateExperience(profileData.experience)}
                </span>
              </div>

              {!ratingLoading && ratingSummary.total > 0 && (
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                  <StarRow value={ratingSummary.average} size={15} />
                  <span className="text-sm font-medium text-white">
                    {ratingSummary.average.toFixed(1)}
                  </span>
                  <span className="text-xs text-teal-50/70">
                    ({ratingSummary.total} đánh giá)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Quick stat strip ---------- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 -mt-6 relative z-10 px-1">
          <div className="bg-white rounded-xl shadow-sm border border-[#E3E7E1] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg text-[#B8863B] flex items-center justify-center shrink-0">
              <IconWallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                Phí khám
              </p>
              <p className="text-sm font-semibold text-[#1F2A27]">
                {currency} {profileData.fees}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E3E7E1] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg text-[#155E56] flex items-center justify-center shrink-0">
              <IconMapPin className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                Địa chỉ
              </p>
              <p className="text-sm font-semibold text-[#1F2A27] truncate">
                {profileData.address.line1 || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E3E7E1] p-4 flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                available ? " text-[#2F9E6E]" : "bg-gray-100 text-gray-400"
              }`}
            >
              <IconClock className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                Trạng thái
              </p>
              <p
                className={`text-sm font-semibold ${available ? "text-[#2F9E6E]" : "text-gray-500"}`}
              >
                {available ? "Còn trống lịch" : "Đã kín lịch"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E3E7E1] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg text-[#E0A93B] flex items-center justify-center shrink-0">
              <IconStarFilled className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                Đánh giá
              </p>
              <p className="text-sm font-semibold text-[#1F2A27]">
                {ratingSummary.total > 0
                  ? `${ratingSummary.average.toFixed(1)} / 5`
                  : "Chưa có"}
              </p>
            </div>
          </div>
        </div>

        {/* ---------- Main details card ---------- */}
        <div className="mt-8 bg-white rounded-2xl border border-[#E3E7E1] shadow-sm p-6 sm:p-8">
          {/* About */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#155E56] mb-2">
              Giới thiệu
            </p>
            {isEdit ? (
              <textarea
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, about: e.target.value }))
                }
                className="w-full rounded-lg border border-[#DCE3DC] bg-[#FAFBF9] p-3 text-sm text-gray-700 outline-none focus:border-[#155E56] focus:ring-2 focus:ring-[#155E56]/15 transition"
                rows={6}
                value={profileData.about}
                placeholder="Giới thiệu ngắn về bản thân, kinh nghiệm chuyên môn..."
              />
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed max-w-[700px]">
                {profileData.about || "Chưa có phần giới thiệu."}
              </p>
            )}
          </div>

          <div className="h-px bg-[#EEF1EC] my-6" />

          {/* Fees + Address */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#155E56] mb-2">
                <IconWallet className="w-3.5 h-3.5" /> Phí khám
              </p>
              {isEdit ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{currency}</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-[#DCE3DC] bg-[#FAFBF9] px-3 py-2 text-sm outline-none focus:border-[#155E56] focus:ring-2 focus:ring-[#155E56]/15 transition"
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        fees: e.target.value,
                      }))
                    }
                    value={profileData.fees}
                  />
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {currency} {profileData.fees}
                </p>
              )}
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#155E56] mb-2">
                <IconMapPin className="w-3.5 h-3.5" /> Địa chỉ
              </p>
              {isEdit ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="w-full rounded-lg border border-[#DCE3DC] bg-[#FAFBF9] px-3 py-2 text-sm outline-none focus:border-[#155E56] focus:ring-2 focus:ring-[#155E56]/15 transition"
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        address: { ...prev.address, line1: e.target.value },
                      }))
                    }
                    value={profileData.address.line1}
                    placeholder="Địa chỉ dòng 1"
                  />
                  <input
                    type="text"
                    className="w-full rounded-lg border border-[#DCE3DC] bg-[#FAFBF9] px-3 py-2 text-sm outline-none focus:border-[#155E56] focus:ring-2 focus:ring-[#155E56]/15 transition"
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        address: { ...prev.address, line2: e.target.value },
                      }))
                    }
                    value={profileData.address.line2}
                    placeholder="Địa chỉ dòng 2"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {profileData.address.line1}
                  <br />
                  {profileData.address.line2}
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-[#EEF1EC] my-6" />

          {/* Availability toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Trạng thái lịch khám
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Bật để bệnh nhân có thể đặt lịch với bạn
              </p>
            </div>
            <label
              className={`relative inline-flex items-center ${isEdit ? "cursor-pointer" : "cursor-default opacity-70"}`}
            >
              <input
                type="checkbox"
                className="sr-only peer"
                disabled={!isEdit}
                onChange={() =>
                  isEdit &&
                  setProfileData((prev) => ({
                    ...prev,
                    available: !prev.available,
                  }))
                }
                checked={profileData.available}
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#27A4F2] rounded-full transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-7">
            {isEdit ? (
              <>
                <button
                  onClick={cancelEdit}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <IconX className="w-4 h-4" /> Hủy
                </button>
                <button
                  onClick={updateProfile}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium text-white bg-[#6633FF] hover:bg-[#155E56] transition disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <IconLoader className="w-4 h-4" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <IconCheck className="w-4 h-4" /> Lưu thay đổi
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium text-[#6633FF] border border-[#6633FF] hover:bg-[#6633FF] hover:text-white transition"
              >
                <IconPencil className="w-4 h-4" /> Chỉnh sửa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
