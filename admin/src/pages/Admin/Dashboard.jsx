import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";

// Import hệ thống Icon hiện đại
import {
  Stethoscope,
  CalendarDays,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  Mail,
} from "lucide-react";

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } =
    useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);

  // --- BỘ STATE SỬ DỤNG DANH TỪ (NOUNS) ---
  const [emailSearchQuery, setEmailSearchQuery] = useState("");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("All");
  const [dateSortOrder, setDateSortOrder] = useState("newest");

  useEffect(() => {
    if (aToken) {
      getDashData();
    }
  }, [aToken]);

  // --- LOGIC DỮ LIỆU ---
  // Lấy toàn bộ danh sách để có thể lọc/tìm kiếm thay vì chỉ cắt 5 phần tử đầu
  const appointmentsList = dashData?.latestAppointments || [];

  const processedAppointments = appointmentsList
    .filter((item) => {
      // Ưu tiên tìm kiếm bằng Email (Email của Bác sĩ hoặc Bệnh nhân)
      const patientEmailMatch = item.userData?.email
        ?.toLowerCase()
        .includes(emailSearchQuery.toLowerCase());
      const doctorEmailMatch = item.docData?.email
        ?.toLowerCase()
        .includes(emailSearchQuery.toLowerCase());

      // Fallback tìm kiếm bằng tên phòng hờ trường hợp data cũ không có email
      const fallbackNameMatch = item.docData?.name
        ?.toLowerCase()
        .includes(emailSearchQuery.toLowerCase());

      const searchMatch =
        emailSearchQuery === ""
          ? true
          : patientEmailMatch || doctorEmailMatch || fallbackNameMatch;

      // Phân loại trạng thái
      let statusMatch = true;
      if (appointmentStatusFilter === "Completed")
        statusMatch = item.isCompleted === true;
      if (appointmentStatusFilter === "Cancelled")
        statusMatch = item.cancelled === true;
      if (appointmentStatusFilter === "Upcoming")
        statusMatch = !item.isCompleted && !item.cancelled;

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      // Sắp xếp
      return dateSortOrder === "newest" ? -1 : 1;
    });

  return (
    dashData && (
      <div className="w-full py-6 px-4 md:px-8 max-h-[90vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
        {/* --- HEADER --- */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Tổng quan Hệ thống
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Báo cáo thống kê và hoạt động gần đây
          </p>
        </div>

        {/* --- KHỐI THỐNG KÊ (SUMMARY CARDS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          {/* Card Bác sĩ */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Stethoscope size={32} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800">
                {dashData.doctors}
              </p>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">
                Bác sĩ
              </p>
            </div>
          </div>

          {/* Card Lịch hẹn */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <CalendarDays size={32} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800">
                {dashData.appointments}
              </p>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">
                Lịch hẹn
              </p>
            </div>
          </div>

          {/* Card Bệnh nhân */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <Users size={32} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800">
                {dashData.patients}
              </p>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">
                Bệnh nhân
              </p>
            </div>
          </div>
        </div>

        {/* --- KHU VỰC DANH SÁCH & BỘ LỌC --- */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] mt-10 flex flex-col overflow-hidden">
          {/* Header Bảng & Tool Điều khiển */}
          <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                <Clock className="text-primary" size={20} />
              </div>
              <p className="text-lg font-bold text-gray-800">
                Tiến trình Lịch hẹn
              </p>
            </div>

            {/* Thanh công cụ (Control Panel) */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search by Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm bằng Email..."
                  value={emailSearchQuery}
                  onChange={(e) => setEmailSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all bg-white"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-gray-400" />
                </div>
                <select
                  value={appointmentStatusFilter}
                  onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                  className="w-full sm:w-44 pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-sm appearance-none bg-white cursor-pointer transition-all"
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="Upcoming">Sắp tới</option>
                  <option value="Completed">Đã xong</option>
                  <option value="Cancelled">Đã hủy</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ArrowUpDown size={16} className="text-gray-400" />
                </div>
                <select
                  value={dateSortOrder}
                  onChange={(e) => setDateSortOrder(e.target.value)}
                  className="w-full sm:w-40 pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-sm appearance-none bg-white cursor-pointer transition-all"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danh sách Dữ liệu */}
          <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {processedAppointments.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {processedAppointments.map((item, index) => (
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4 hover:bg-blue-50/40 transition-colors duration-200"
                    key={item._id || index}
                  >
                    {/* Bác sĩ & Thời gian */}
                    <div className="flex items-center gap-4">
                      <img
                        className="rounded-full w-12 h-12 object-cover border border-gray-100 shadow-sm"
                        src={item.docData.image}
                        alt="Doctor"
                      />
                      <div className="flex flex-col">
                        <p className="text-gray-800 font-bold text-base">
                          {item.docData.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <CalendarDays size={12} className="text-primary" />
                          <span>Ngày {slotDateFormat(item.slotDate)}</span>
                          <span className="mx-1 text-gray-300">•</span>
                          <span>Ca: {item.slotTime}</span>
                        </div>
                        {/* Hiển thị Email Bác sĩ (Hỗ trợ visual cho phần search) */}
                        {item.docData?.email && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                            <Mail size={10} /> {item.docData.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trạng thái / Hành động */}
                    <div className="flex items-center sm:justify-end">
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
                            if (window.confirm("Bạn muốn hủy lịch hẹn này?")) {
                              cancelAppointment(item._id);
                            }
                          }}
                          className="group flex items-center gap-1.5 bg-white text-gray-600 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-full text-xs font-bold border border-gray-200 transition-all shadow-sm"
                          title="Hủy lịch trình"
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
            ) : (
              /* Trạng thái trống */
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                <Search
                  size={40}
                  className="mb-3 text-gray-300"
                  strokeWidth={1.5}
                />
                <p className="font-bold text-gray-600">
                  Không tìm thấy dữ liệu
                </p>
                <p className="text-sm mt-1 max-w-sm">
                  Không có lịch hẹn nào khớp với email hoặc trạng thái bộ lọc
                  bạn đang chọn.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default Dashboard;
