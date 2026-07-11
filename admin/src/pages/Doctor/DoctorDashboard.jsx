import React, { useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";

const DoctorDashboard = () => {
  const {
    dToken,
    dashData,
    getDashData,
    cancelAppointment,
    acceptAppointment,
    completeAppointment,
  } = useContext(DoctorContext);
  const { slotDateFormat, currency } = useContext(AppContext);

  useEffect(() => {
    if (dToken) {
      getDashData();
    }
  }, [dToken]);

  return (
    dashData && (
      <div className="w-full min-h-screen p-5 md:p-8 bg-[#F8F9FD]">
        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="flex items-center gap-5 bg-white p-6 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <img
                className="w-12 h-12 object-contain"
                src={assets.earning_icon}
                alt="Earnings"
              />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {dashData.earnings}{" "}
                <span className="text-lg text-gray-500 font-medium">
                  {currency}
                </span>
              </p>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Tổng thu nhập
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 bg-white p-6 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <img
                className="w-12 h-12 object-contain"
                src={assets.appointments_icon}
                alt="Appointments"
              />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {dashData.appointments}
              </p>
              <p className="text-sm font-medium text-gray-400 mt-1">Lịch hẹn</p>
            </div>
          </div>

          <div className="flex items-center gap-5 bg-white p-6 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <img
                className="w-12 h-12 object-contain"
                src={assets.patients_icon}
                alt="Patients"
              />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {dashData.patients}
              </p>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Bệnh nhân
              </p>
            </div>
          </div>
        </div>

        {/* LATEST APPOINTMENTS LIST */}
        <div className="bg-white mt-10 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <div className="p-2 bg-white shadow-sm rounded-lg border border-gray-100">
              <img className="w-5 h-5" src={assets.list_icon} alt="List" />
            </div>
            <p className="font-bold text-gray-700 text-lg">Lịch hẹn mới nhất</p>
          </div>

          {/* List Items */}
          <div className="flex flex-col">
            {dashData.latestAppointments.slice(0, 5).map((item, index) => (
              <div
                className="flex items-center px-6 py-4 gap-4 hover:bg-blue-50/30 transition-colors border-b border-gray-50 last:border-none"
                key={index}
              >
                <img
                  className="rounded-full w-12 h-12 object-cover border-2 border-white shadow-sm ring-2 ring-gray-100"
                  src={item.userData.image}
                  alt={item.userData.name}
                />
                <div className="flex-1">
                  <p className="text-gray-800 font-semibold text-base">
                    {item.userData.name}
                  </p>
                  <p className="text-gray-500 text-sm mt-0.5 font-medium">
                    Đặt lịch ngày{" "}
                    <span className="text-primary">
                      {slotDateFormat(item.slotDate)}
                    </span>
                  </p>
                </div>

                {/* Status Badges & Buttons */}
                <div className="ml-auto">
                  {item.cancelled ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-500 border border-red-100">
                      Đã hủy
                    </span>
                  ) : item.isCompleted ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-500 border border-green-100">
                      Đã khám xong
                    </span>
                  ) : !item.isAccepted ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cancelAppointment(item._id)}
                        className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 active:scale-95"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => acceptAppointment(item._id)}
                        className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-primary/30 hover:bg-blue-600 hover:shadow-lg hover:shadow-primary/40 transition-all duration-200 active:scale-95"
                      >
                        Chấp nhận
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-primary border border-blue-100">
                      Đã chấp nhận
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Empty State (Dự phòng khi chưa có lịch hẹn) */}
            {dashData.latestAppointments.length === 0 && (
              <div className="px-6 py-10 text-center text-gray-500 font-medium">
                Chưa có lịch hẹn nào gần đây.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorDashboard;
