import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { NavLink } from "react-router-dom";
import { DoctorContext } from "../context/DoctorContext";
import { AdminContext } from "../context/AdminContext";

const Sidebar = () => {
  const { dToken, profileData } = useContext(DoctorContext);
  const { aToken } = useContext(AdminContext);

  // Style đồng bộ 100% cho các nút menu
  const navLinkStyles = ({ isActive }) =>
    `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition-all duration-200 ${
      isActive
        ? "bg-[#F2F3FF] border-r-4 border-primary text-primary font-semibold"
        : "text-[#515151] hover:bg-gray-50 hover:text-gray-700"
    }`;

  // Icon dùng filter để đổi màu khi active (vì <img> không nhận text-color)
  const iconStyle = (isActive) => ({
    filter: isActive
      ? "invert(35%) sepia(90%) saturate(1500%) hue-rotate(200deg) brightness(95%)"
      : "none",
  });

  return (
    <div className="h-screen sticky top-0 bg-white border-r flex flex-col justify-between overflow-y-auto">
      {/* KHỐI TRÊN: Chứa các Menu Điều Hướng */}
      <div>
        {/* ---------- CÁC TUYẾN ĐƯỜNG DÀNH CHO ADMIN ---------- */}
        {aToken && (
          <ul className="mt-5">
            <NavLink to={"/admin-dashboard"} end className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5"
                    style={iconStyle(isActive)}
                    src={assets.home_icon}
                    alt=""
                  />
                  <p className="hidden md:block">Bảng điều khiển</p>
                </>
              )}
            </NavLink>

            <NavLink to={"/all-appointments"} className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5"
                    style={iconStyle(isActive)}
                    src={assets.appointment_icon}
                    alt=""
                  />
                  <p className="hidden md:block">Lịch hẹn</p>
                </>
              )}
            </NavLink>

            <NavLink to={"/add-doctor"} className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5"
                    style={iconStyle(isActive)}
                    src={assets.add_icon}
                    alt=""
                  />
                  <p className="hidden md:block">Thêm bác sĩ</p>
                </>
              )}
            </NavLink>

            <NavLink to={"/doctor-list"} end className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5"
                    style={iconStyle(isActive)}
                    src={assets.people_icon}
                    alt=""
                  />
                  <p className="hidden md:block">Danh sách bác sĩ</p>
                </>
              )}
            </NavLink>

            <NavLink to={"/patients-list"} end className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5"
                    style={iconStyle(isActive)}
                    src={assets.people_icon}
                    alt=""
                  />
                  <p className="hidden md:block">Danh sách bệnh nhân</p>
                </>
              )}
            </NavLink>
          </ul>
        )}

        {/* ---------- CÁC TUYẾN ĐƯỜNG DÀNH CHO BÁC SĨ ---------- */}
        {dToken && (
          <ul className="mt-5">
            <NavLink to={"/doctor-dashboard"} end className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5"
                    style={iconStyle(isActive)}
                    src={assets.home_icon}
                    alt=""
                  />
                  <p className="hidden md:block">Bảng điều khiển</p>
                </>
              )}
            </NavLink>

            <NavLink to={"/doctor-availability"} className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5"
                    style={iconStyle(isActive)}
                    src={assets.add_icon}
                    alt=""
                  />
                  <p className="hidden md:block">Lịch làm việc</p>
                </>
              )}
            </NavLink>

            <NavLink to={"/doctor-appointments"} className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5"
                    style={iconStyle(isActive)}
                    src={assets.appointment_icon}
                    alt=""
                  />
                  <p className="hidden md:block">Lịch hẹn</p>
                </>
              )}
            </NavLink>

            <NavLink to={"/doctor-profile"} end className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5"
                    style={iconStyle(isActive)}
                    src={assets.people_icon}
                    alt=""
                  />
                  <p className="hidden md:block">Hồ sơ</p>
                </>
              )}
            </NavLink>

            <NavLink to={"/doctor-security"} className={navLinkStyles}>
              {({ isActive }) => (
                <>
                  <img
                    className="min-w-5 opacity-70"
                    style={iconStyle(isActive)}
                    src={assets.setting}
                    alt=""
                  />
                  <p className="hidden md:block">Cài đặt</p>
                </>
              )}
            </NavLink>
          </ul>
        )}
      </div>

      {/* KHỐI DƯỚI ĐÁY: Profile thu nhỏ của Bác sĩ khi đăng nhập */}
      {dToken && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
          <NavLink
            to={"/doctor-profile"}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 p-2 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-sm cursor-pointer group ${
                isActive
                  ? "bg-white shadow-sm ring-1 ring-primary/30 text-primary"
                  : "text-[#515151]"
              }`
            }
          >
            <img
              className="w-10 h-10 rounded-full object-cover border border-blue-100 bg-white shadow-inner flex-shrink-0"
              src={profileData?.image || assets.people_icon}
              alt="Doctor Avatar"
            />

            <div className="hidden md:block min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
                {profileData?.name || "Bác sĩ"}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {profileData?.speciality || "Chuyên gia y tế"}
              </p>
            </div>
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
