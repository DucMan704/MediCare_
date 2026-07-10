import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";
import axios from "axios";
import {
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit,
  UserPlus,
  Star,
  Clock,
  Users,
  Stethoscope,
  CheckCircle2,
  XCircle,
  MessageSquare,
  X,
  Calendar,
  DollarSign,
  UserCheck,
} from "lucide-react";

const DoctorsList = () => {
  const {
    doctors,
    changeAvailability,
    aToken,
    getAllDoctors,
    deleteDoctor,
    backendUrl,
  } = useContext(AdminContext);
  const navigate = useNavigate();

  // --- BỘ STATE QUẢN LÝ BỘ LỌC NÂNG CAO ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpeciality, setSelectedSpeciality] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Available, Unavailable
  const [sortBy, setSortBy] = useState("name-asc");

  // --- STATE CAO CẤP QUẢN LÝ MODAL & REVIEW THỰC TẾ (LAZY LOADING) ---
  const [activeReviewModal, setActiveReviewModal] = useState({
    isOpen: false,
    loading: false,
    doctorName: "",
    avgRating: "0.0",
    count: 0,
    reviewsList: [],
  });

  // Gọi danh sách bác sĩ ban đầu từ Hệ thống Context
  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);

  // --- HÀM XỬ LÝ SỰ KIỆN KHÓA XÓA ---
  const handleDelete = (e, doctorId, doctorName) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `CẢNH BÁO: Bạn có chắc muốn xóa bác sĩ ${doctorName}? Hành động này không thể hoàn tác.`,
    );
    if (confirmDelete) {
      deleteDoctor(doctorId);
    }
  };

  const handleCardClick = (doctorId) => {
    navigate(`/edit-doctor/${doctorId}`);
  };

  // --- CHỨC NĂNG CHÍNH: KÍCH HOẠT GỌI API LẤY REVIEW KHI CLICK CHI TIẾT ---
  const openReviewModal = async (e, doctorName, docId) => {
    e.stopPropagation();

    // 1. Mở khung Modal trước và bật trạng thái Đang tải dữ liệu
    setActiveReviewModal({
      isOpen: true,
      loading: true,
      doctorName: doctorName,
      avgRating: "0.0",
      count: 0,
      reviewsList: [],
    });

    try {
      const base = import.meta.env.VITE_BACKEND_URL;
      // Xác định đường dẫn chuẩn từ biến môi trường hệ thống
      console.log(
        `Đang fetch dữ liệu review từ Backend: ${base}/api/doctor/reviews/${docId}`,
      );

      // ĐỔI THÀNH: Hứng trọn vẹn response từ axios thay vì destruct { data } ngay lập tức
      const response = await axios.get(`${base}/api/doctor/reviews/${docId}`);

      console.log("Kết quả phản hồi từ Backend:", response.data);

      // Kiểm tra chuẩn cấu trúc response.data từ Backend của bạn
      if (response.data && response.data.success === true) {
        const reviews = response.data.reviews || [];
        const count = reviews.length;

        // Tính toán Điểm đánh giá trung bình Real-time tích lũy từ mảng dữ liệu trả về
        const totalRating = reviews.reduce(
          (sum, r) => sum + (r.rating || 0),
          0,
        );
        const avgRating = count > 0 ? (totalRating / count).toFixed(1) : "0.0";

        // 2. Đồng bộ dữ liệu sạch nhận từ database vào Modal
        setActiveReviewModal({
          isOpen: true,
          loading: false,
          doctorName: doctorName,
          avgRating: avgRating,
          count: count,
          reviewsList: reviews,
        });
      } else {
        // Trường hợp Backend phản hồi success: false
        throw new Error(response.data?.message || "Lỗi phản hồi hệ thống.");
      }
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu từ hàm getDoctorReview:", error);
      // Tắt màn hình chờ nếu gặp lỗi kết nối API
      setActiveReviewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // --- XỬ LÝ DỮ LIỆU ĐA LỌC TRÊN GIAO DIỆN (SEARCH, FILTER, SORT) ---
  const uniqueSpecialities = [
    "All",
    ...new Set(doctors.map((doc) => doc.speciality).filter(Boolean)),
  ];

  const processedDoctors = doctors
    .filter((doc) => doc.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(
      (doc) =>
        selectedSpeciality === "All" || doc.speciality === selectedSpeciality,
    )
    .filter((doc) => {
      if (statusFilter === "All") return true;
      if (statusFilter === "Available") return doc.available === true;
      if (statusFilter === "Unavailable") return doc.available === false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "fees-desc") return (b.fees || 0) - (a.fees || 0);
      return 0;
    });

  return (
    <div className="m-5 md:m-8 max-h-[90vh] overflow-y-auto pb-10 relative custom-scrollbar">
      {/* ---------- HEADER & KHỐI TỔNG QUAN THỐNG KÊ ---------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Danh sách Bác sĩ Hệ thống
            <span className="bg-primary/10 text-primary text-sm py-1 px-3 rounded-full font-bold">
              {processedDoctors.length}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Tổng hợp dữ liệu, quản lý trạng thái phân ca và kết nối đánh giá
            bệnh nhân.
          </p>
        </div>
        <button
          onClick={() => navigate("/add-doctor")}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 shrink-0"
        >
          <UserPlus size={18} />
          Thêm bác sĩ mới
        </button>
      </div>

      {/* ---------- THANH ĐIỀU KHIỂN ĐA CHỨC NĂNG (TÌM KIẾM, LỌC TRẠNG THÁI, CHUYÊN KHOA, SẮP XẾP) ---------- */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 mb-8">
        {/* Nhóm tìm kiếm text */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm chính xác theo họ và tên bác sĩ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
          />
        </div>

        {/* Khối các Dropdown tính năng bổ sung */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
          {/* 1. Lọc Chuyên Khoa */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Stethoscope size={16} className="text-gray-400" />
            </div>
            <select
              value={selectedSpeciality}
              onChange={(e) => setSelectedSpeciality(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm appearance-none bg-white cursor-pointer transition-all"
            >
              {uniqueSpecialities.map((spec, index) => (
                <option key={index} value={spec}>
                  {spec === "All" ? "Tất cả chuyên khoa" : spec}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Lọc Trạng thái Khả dụng */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserCheck size={16} className="text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm appearance-none bg-white cursor-pointer transition-all"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Available">Đang nhận bệnh</option>
              <option value="Unavailable">Hiện kín lịch</option>
            </select>
          </div>

          {/* 3. Sắp xếp Tiêu chí */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDown size={16} className="text-gray-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm appearance-none bg-white cursor-pointer transition-all"
            >
              <option value="name-asc">Tên (A - Z)</option>
              <option value="name-desc">Tên (Z - A)</option>
              <option value="fees-desc">Giá khám (Cao → Thấp)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ---------- HIỂN THỊ DANH SÁCH BÁC SĨ TỔNG QUAN LƯỚI GRID ---------- */}
      {processedDoctors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedDoctors.map((item) => (
            <div
              key={item._id}
              onClick={() => handleCardClick(item._id)}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Khối Ảnh & Badges Overlay */}
              <div className="relative aspect-[4/3] overflow-hidden bg-blue-50/50">
                <img
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  src={item.image}
                  alt={item.name}
                />

                {/* Badge Trạng thái nhận lịch đầu ảnh */}
                <div
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-md ${
                    item.available
                      ? "bg-emerald-500/90 text-white"
                      : "bg-rose-500/90 text-white"
                  }`}
                >
                  {item.available ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  {item.available ? "Nhận bệnh" : "Kín lịch"}
                </div>

                {/* Nút xem Review nhanh nằm dưới ảnh */}
                <div
                  onClick={(e) => openReviewModal(e, item.name, item._id)}
                  className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 text-gray-700 shadow-sm border border-gray-100 hover:bg-primary hover:text-white transition-all duration-200"
                  title="Xem tổng hợp đánh giá thực tế"
                >
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span>Xem Phản Hồi</span>
                </div>
              </div>

              {/* Khối Nội Dung Chi Tiết */}
              <div className="p-5 flex-1 flex flex-col">
                <p
                  className="text-gray-800 text-lg font-bold truncate"
                  title={item.name}
                >
                  {item.name}
                </p>

                <div className="inline-flex items-center gap-1.5 text-primary bg-primary/10 w-fit px-2.5 py-1 rounded-md text-xs font-semibold mt-1.5 mb-3">
                  <Stethoscope size={14} />
                  {item.speciality}
                </div>

                {/* Bổ sung thông tin phụ chi tiết */}
                <div className="flex flex-col gap-2 mt-auto mb-4 border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} className="text-gray-400" />
                    <span>
                      {item.experience || "5+"} năm kinh nghiệm chuyên khoa
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <DollarSign size={14} className="text-gray-400" />
                    <span>
                      Giá khám niêm yết:{" "}
                      <span className="text-gray-800 font-bold">
                        {item.fees
                          ? `${item.fees.toLocaleString()} VNĐ`
                          : "Chưa cập nhật"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Khối chức năng chân Card */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  {/* Nút gạt Toggle Trạng thái khả dụng iOS Style */}
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      changeAvailability(item._id);
                    }}
                  >
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ease-in-out ${item.available ? "bg-primary" : "bg-gray-300"}`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${item.available ? "translate-x-4.5" : "translate-x-1"}`}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold ${item.available ? "text-primary" : "text-gray-500"}`}
                    >
                      {item.available ? "Đang mở" : "Tạm ẩn"}
                    </span>
                  </div>

                  {/* Nhóm các nút thao tác nhanh */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openReviewModal(e, item.name, item._id)}
                      className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition duration-200"
                      title="Xem tất cả phản hồi bệnh nhân"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(item._id);
                      }}
                      className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition duration-200"
                      title="Chỉnh sửa hồ sơ thông tin"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, item._id, item.name)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition duration-200"
                      title="Xóa bác sĩ khỏi hệ thống"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Trạng thái bộ lọc trống */
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-700">
            Không tìm thấy kết quả phù hợp
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedSpeciality("All");
              setStatusFilter("All");
              setSortBy("name-asc");
            }}
            className="mt-4 text-primary font-medium text-sm hover:underline"
          >
            Reset toàn bộ bộ lọc
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHỨC NĂNG ĐỒNG BỘ: MODAL POPUP HIỂN THỊ CHI TIẾT REVIEW THỰC TẾ          */}
      {/* ========================================================================= */}
      {activeReviewModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl border border-gray-100 transform scale-100 transition-transform duration-300">
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  Đánh giá & Nhận xét từ bệnh nhân
                </h3>
                <p className="text-sm text-primary font-medium mt-0.5">
                  Bác sĩ phụ trách: {activeReviewModal.doctorName}
                </p>
              </div>
              <button
                onClick={() =>
                  setActiveReviewModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Thân hiển thị danh sách Review có tích hợp hiệu ứng Loading */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-slate-50/50 min-h-[250px] justify-start">
              {activeReviewModal.loading ? (
                /* HIỆU ỨNG SPIN KHI ĐANG ĐỢI API TRẢ KẾT QUẢ */
                <div className="flex flex-col items-center justify-center py-20 my-auto text-gray-500">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-medium">
                    Đang đồng bộ nhận xét từ cơ sở dữ liệu...
                  </p>
                </div>
              ) : activeReviewModal.reviewsList.length > 0 ? (
                <>
                  {/* Khung tổng kết điểm trung bình thực tế */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm shrink-0">
                    <span className="text-sm font-bold text-gray-700">
                      Đánh giá tích lũy:
                    </span>
                    <div className="flex items-center gap-1">
                      <Star
                        size={16}
                        className="text-amber-500 fill-amber-500"
                      />
                      <span className="text-lg font-black text-amber-700">
                        {activeReviewModal.avgRating}
                      </span>
                      <span className="text-xs text-gray-500 font-normal">
                        ({activeReviewModal.count} lượt đánh giá)
                      </span>
                    </div>
                  </div>

                  {/* Danh sách mảng bình luận */}
                  {activeReviewModal.reviewsList.map((review) => (
                    <div
                      key={review._id}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              review.userId?.image ||
                              "https://via.placeholder.com/150"
                            }
                            alt="Bệnh nhân"
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-800">
                              {review.userId?.name || "Bệnh nhân ẩn danh"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Calendar size={12} />
                              <span>
                                {new Date(review.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg">
                          <Star
                            size={13}
                            className="text-amber-400 fill-amber-400"
                          />
                          <span className="text-xs font-bold text-amber-700">
                            {review.rating}.0
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                        "
                        {review.comment ||
                          "Bệnh nhân không gửi nội dung bình luận chữ."}
                        "
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                /* Trạng thái không có review dữ liệu trống */
                <div className="flex flex-col items-center justify-center py-16 my-auto text-center text-gray-400">
                  <MessageSquare
                    size={44}
                    strokeWidth={1.5}
                    className="mb-2 text-gray-300"
                  />
                  <p className="font-bold text-gray-500">
                    Chưa nhận được đánh giá
                  </p>
                  <p className="text-xs max-w-[240px] mt-1 text-gray-400">
                    Bác sĩ này hiện tại chưa có dữ liệu phản hồi hay đóng góp ý
                    kiến nào từ khách hàng trên hệ thống.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 flex justify-end bg-white rounded-b-2xl">
              <button
                onClick={() =>
                  setActiveReviewModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
