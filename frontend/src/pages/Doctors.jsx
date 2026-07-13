import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import { specialityList, translateSpeciality } from "../utils/i18n";
import { assets, specialityData } from "../assets/assets"; // ĐÃ THÊM IMPORT THÀNH CÔNG
import {
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  Star,
  X,
  Inbox,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

// Renders 5 stars with a partial fill based on `value` (0–5, decimals ok).
const StarRating = ({ value = 0, size = 13 }) => {
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

const SORT_OPTIONS = [
  { value: "name_asc", label: "Tên: A → Z" },
  { value: "name_desc", label: "Tên: Z → A" },
  { value: "rating_desc", label: "Đánh giá cao nhất" },
  { value: "fee_asc", label: "Phí khám: Thấp → Cao" },
  { value: "fee_desc", label: "Phí khám: Cao → Thấp" },
];

const Doctors = () => {
  const { speciality } = useParams();

  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("name_asc");
  const [availableOnly, setAvailableOnly] = useState(false);

  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  // Search -> speciality (from URL) -> availability -> sort
  const filteredDoctors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let list = doctors.filter((doc) => {
      const matchesSpeciality = !speciality || doc.speciality === speciality;
      const matchesSearch =
        !term ||
        doc.name.toLowerCase().includes(term) ||
        translateSpeciality(doc.speciality).toLowerCase().includes(term);
      const matchesAvailability = !availableOnly || doc.available;

      return matchesSpeciality && matchesSearch && matchesAvailability;
    });

    list = [...list].sort((a, b) => {
      switch (sortOrder) {
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "rating_desc":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "fee_asc":
          return (a.fees || 0) - (b.fees || 0);
        case "fee_desc":
          return (b.fees || 0) - (a.fees || 0);
        case "name_asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [doctors, speciality, searchTerm, sortOrder, availableOnly]);

  const hasActiveFilters = searchTerm.trim() !== "" || availableOnly;

  return (
    <div className="pb-16">
      <p className="text-gray-600">
        Duyệt qua danh sách bác sĩ theo chuyên khoa.
      </p>

      {/* ---------------------------------------------------------- */}
      {/* Search / sort / availability bar                           */}
      {/* ---------------------------------------------------------- */}
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-9 text-sm text-[#363636] outline-none transition-colors focus:border-primary focus:bg-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 whitespace-nowrap text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Chỉ hiện bác sĩ còn lịch
        </label>

        <div className="relative">
          <ArrowUpDown
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-0 pl-8 pr-8 text-sm text-[#363636] outline-none focus:border-primary sm:w-52"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row">
        {/* Button hiển thị bộ lọc trên mobile */}
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex min-w-[120px] items-center gap-2 rounded-lg border px-5 py-2 text-sm transition-all sm:hidden ${
            showFilter ? "bg-primary text-white" : ""
          }`}
        >
          <SlidersHorizontal size={14} />
          Bộ lọc
        </button>

        {/* Danh sách chuyên khoa */}
        <div
          className={`flex-col gap-3 text-sm text-gray-700 w-full sm:w-auto ${
            showFilter ? "flex" : "hidden sm:flex"
          }`}
        >
          <div className="flex flex-col gap-2">
            {/* Nút tất cả chuyên khoa */}
            <button
              onClick={() => navigate("/doctors")}
              className={`w-full flex items-center gap-3 rounded-lg border px-5 py-3 text-left transition-all duration-300 hover:bg-[#EEF2FF] sm:w-60 ${
                !speciality
                  ? "border-primary bg-[#E2E5FF] font-medium text-primary"
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              <span className="w-6 h-6 flex items-center justify-center font-bold text-sm bg-gray-100 rounded-full text-gray-500">
                ☰
              </span>
              Tất cả chuyên khoa
            </button>

            {/* Danh sách các chuyên khoa cụ thể */}
            {specialityList.map((spec) => {
              // Tự động tìm kiếm object trùng khớp từ specialityData bằng tiếng Việt chuẩn
              const matchedSpec = specialityData.find(
                (item) =>
                  item.speciality.toLowerCase() ===
                  translateSpeciality(spec).toLowerCase(),
              );

              return (
                <button
                  key={spec}
                  onClick={() =>
                    speciality === spec
                      ? navigate("/doctors")
                      : navigate(`/doctors/${spec}`)
                  }
                  className={`w-full flex items-center gap-3 rounded-lg border px-5 py-3 text-left transition-all duration-300 hover:bg-[#EEF2FF] sm:w-60 ${
                    speciality === spec
                      ? "border-primary bg-[#E2E5FF] font-medium text-primary"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}
                >
                  {/* Hiển thị Icon thông minh trực tiếp từ assets */}
                  {matchedSpec?.image && (
                    <img
                      src={matchedSpec.image}
                      alt={translateSpeciality(spec)}
                      className={`w-6 h-6 object-contain transition-all ${
                        speciality === spec ? "scale-110" : "opacity-70"
                      }`}
                    />
                  )}

                  <span>{translateSpeciality(spec)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Danh sách bác sĩ */}
        <div className="w-full">
          {filteredDoctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
              <Inbox size={22} className="text-gray-300" />
              {hasActiveFilters
                ? "Không tìm thấy bác sĩ phù hợp"
                : "Chưa có bác sĩ nào trong danh mục này"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 w-full">
              {filteredDoctors.map((item) => (
                <div
                  key={item._id}
                  onClick={() => {
                    navigate(`/appointment/${item._id}`);
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className="cursor-pointer overflow-hidden rounded-xl border border-[#C9D8FF] bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-md group"
                >
                  {/* SỬA CHUẨN: Kích thước ảnh lấp đầy khung hình không bị méo */}
                  <img
                    className="w-full h-48 object-cover bg-[#EAEFFF] transition-transform duration-500 group-hover:scale-105"
                    src={item.image}
                    alt={item.name}
                  />

                  <div className="p-4">
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        item.available ? "text-green-500" : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          item.available
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-500"
                        }`}
                      ></span>
                      <span>
                        {item.available ? "Còn trống" : "Không có lịch"}
                      </span>
                    </div>

                    <h3 className="mt-2 text-lg font-semibold text-gray-800 line-clamp-1">
                      {item.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {translateSpeciality(item.speciality)}
                    </p>

                    {/* Rating - Hiển thị nếu có dữ liệu đánh giá */}
                    {item.averageRating != null && item.totalReviews > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <StarRating value={item.averageRating} size={13} />
                        <span className="text-xs font-medium text-gray-600">
                          {item.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({item.totalReviews})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
