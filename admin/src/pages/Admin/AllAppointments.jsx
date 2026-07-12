import React, { useEffect, useState, useContext } from "react";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";

// Import bộ icon hiện đại
import {
  Search,
  Filter,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  ArrowUpDown,
  User,
  Stethoscope,
  Inbox,
} from "lucide-react";

const AllAppointments = () => {
  const { aToken, appointments, cancelAppointment, getAllAppointments } =
    useContext(AdminContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);

  // --- CÁC STATE QUẢN LÝ BỘ LỌC VÀ TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Upcoming, Completed, Cancelled
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest

  // Fetch dữ liệu ban đầu
  useEffect(() => {
    if (aToken) {
      getAllAppointments();
    }
  }, [aToken]);

  // --- XỬ LÝ LỌC VÀ SẮP XẾP DỮ LIỆU ---
  const processedAppointments = appointments
    .filter((item) => {
      // Tìm kiếm theo tên Bệnh nhân hoặc Bác sĩ
      const matchSearch =
        item.userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.docData.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Lọc theo trạng thái
      let matchStatus = true;
      if (statusFilter === "Upcoming")
        matchStatus = !item.cancelled && !item.isCompleted;
      if (statusFilter === "Completed") matchStatus = item.isCompleted;
      if (statusFilter === "Cancelled") matchStatus = item.cancelled;

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      // Giả sử mảng gốc từ backend trả về là newest. SortOrder đảo ngược mảng nếu cần.
      return sortOrder === "newest" ? 0 : -1;
    });

  return (
    <div className="w-full py-6 px-4 md:px-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
      {/* --- HEADER TỔNG QUAN --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 w-full">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="text-primary" size={28} />
            Quản lý Lịch hẹn
            <span className="bg-primary/10 text-primary text-sm py-1 px-3 rounded-full font-bold">
              {processedAppointments.length}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi, tìm kiếm và quản lý toàn bộ lịch khám bệnh trên hệ thống.
          </p>
        </div>
      </div>

      {/* --- THANH CÔNG CỤ (SEARCH, FILTER, SORT) --- */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 mb-6 w-full">
        {/* Tìm kiếm */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bệnh nhân hoặc bác sĩ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
          />
        </div>

        {/* Các Dropdown lọc */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          {/* Lọc trạng thái */}
          <div className="relative min-w-[160px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={16} className="text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm appearance-none bg-white cursor-pointer transition-all"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Upcoming">Sắp tới (Chưa khám)</option>
              <option value="Completed">Đã hoàn thành</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="relative min-w-[160px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDown size={16} className="text-gray-400" />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm appearance-none bg-white cursor-pointer transition-all"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- BẢNG DỮ LIỆU LỊCH HẸN --- */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden w-full">
        {processedAppointments.length > 0 ? (
          <div className="w-full overflow-x-auto custom-scrollbar">
            {/* Header của Bảng (Sticky) */}
            <div className="min-w-[900px] grid grid-cols-[0.5fr_2.5fr_1fr_2.5fr_2.5fr_1fr_1.5fr] gap-4 py-4 px-6 bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
              <p className="text-center">#</p>
              <p>Bệnh nhân</p>
              <p className="text-center">Tuổi</p>
              <p>Thời gian hẹn</p>
              <p>Bác sĩ phụ trách</p>
              <p className="text-right">Phí khám</p>
              <p className="text-center">Trạng thái</p>
            </div>

            {/* Các dòng dữ liệu */}
            <div className="min-w-[900px] divide-y divide-gray-50">
              {processedAppointments.map((item, index) => (
                <div
                  className="grid grid-cols-[0.5fr_2.5fr_1fr_2.5fr_2.5fr_1fr_1.5fr] gap-4 items-center py-4 px-6 hover:bg-blue-50/30 transition-colors duration-200"
                  key={item._id || index}
                >
                  {/* STT */}
                  <p className="text-center text-sm font-medium text-gray-400">
                    {sortOrder === "newest"
                      ? index + 1
                      : processedAppointments.length - index}
                  </p>

                  {/* Bệnh nhân */}
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        item.userData.image || "https://via.placeholder.com/150"
                      }
                      className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                      alt="Patient"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {item.userData.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 md:hidden">
                        {calculateAge(item.userData.dob)} tuổi
                      </p>
                    </div>
                  </div>

                  {/* Tuổi */}
                  <div className="flex justify-center">
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-semibold">
                      {calculateAge(item.userData.dob)}t
                    </span>
                  </div>

                  {/* Ngày & Giờ */}
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <CalendarDays size={14} className="text-primary" />
                      {slotDateFormat(item.slotDate)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <Clock size={14} />
                      {item.slotTime}
                    </div>
                  </div>

                  {/* Bác sĩ */}
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        item.docData.image || "https://via.placeholder.com/150"
                      }
                      className="w-10 h-10 rounded-full object-cover bg-blue-50 border border-blue-100 shadow-sm"
                      alt="Doctor"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {item.docData.name}
                      </p>
                      <p className="text-[11px] font-medium text-primary bg-primary/10 w-fit px-1.5 py-0.5 rounded mt-1">
                        {item.docData.speciality}
                      </p>
                    </div>
                  </div>

                  {/* Phí khám */}
                  <p className="text-right text-sm font-bold text-gray-700">
                    {item.amount?.toLocaleString()}
                    {currency}
                  </p>

                  {/* Trạng thái / Thao tác */}
                  <div className="flex justify-center">
                    {item.cancelled ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full text-xs font-bold border border-rose-100">
                        <XCircle size={14} /> Đã hủy
                      </div>
                    ) : item.isCompleted ? (
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                        <CheckCircle2 size={14} /> Hoàn thành
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Bạn có chắc chắn muốn hủy lịch hẹn này?",
                            )
                          ) {
                            cancelAppointment(item._id);
                          }
                        }}
                        className="group flex items-center gap-1.5 bg-white text-gray-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 px-4 py-1.5 rounded-full text-xs font-bold border border-gray-200 transition-all duration-300 shadow-sm"
                        title="Hủy lịch hẹn"
                      >
                        <X
                          size={14}
                          className="text-rose-500 group-hover:text-white transition-colors"
                        />{" "}
                        Hủy lịch
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Trạng thái trống (Empty State) */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Inbox size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-700">
              Không tìm thấy lịch hẹn nào
            </p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Không có dữ liệu phù hợp với bộ lọc hiện tại hoặc hệ thống chưa có
              lịch hẹn mới.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
              }}
              className="mt-4 text-primary font-medium text-sm hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllAppointments;
