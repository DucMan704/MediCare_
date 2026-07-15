import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { DoctorContext } from "../../context/DoctorContext";
import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  Monitor,
  History,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const DoctorSecurity = () => {
  const { dToken, backendUrl } = useContext(DoctorContext);

  // States dữ liệu thực tế từ API
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // States cho đổi mật khẩu
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // States cho Xác thực 2 lớp (2FA) - Giữ để phát triển sau
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Dữ liệu giả lập tạm thời cho danh sách thiết bị (Có thể thay thế bằng API GET /api/doctor/sessions tương tự)
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: "Chrome / Windows 11",
      ip: "113.161.x.x",
      current: true,
      date: "Đang hoạt động",
    },
    {
      id: 2,
      device: "Safari / iPhone 15 Pro",
      ip: "27.67.x.x",
      current: false,
      date: "10 giờ trước",
    },
  ]);

  // Hàm gọi API lấy danh sách Nhật ký bảo mật từ Backend
  const fetchSecurityLogs = async () => {
    if (!dToken) return;
    setIsLoadingLogs(true);
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/security-logs`,
        {
          headers: { dToken },
        },
      );
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy logs bảo mật:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Tự động gọi API lấy nhật ký khi vào trang
  useEffect(() => {
    fetchSecurityLogs();
  }, [dToken]);

  // Hàm tính toán độ mạnh mật khẩu mới (FE Validation)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: "Chưa nhập", color: "bg-gray-200", width: "w-0" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { label: "Yếu", color: "bg-rose-500", width: "w-1/4" };
      case 2:
        return { label: "Trung bình", color: "bg-amber-500", width: "w-1/2" };
      case 3:
        return { label: "Mạnh", color: "bg-blue-500", width: "w-3/4" };
      case 4:
        return { label: "Rất mạnh", color: "bg-emerald-500", width: "w-full" };
      default:
        return { label: "Yếu", color: "bg-rose-500", width: "w-1/4" };
    }
  };

  const strength = getPasswordStrength(passwordData.newPassword);

  // Xử lý gửi Form đổi mật khẩu lên API Backend
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFeedback({
        type: "error",
        message: "Mật khẩu xác nhận không trùng khớp!",
      });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/doctor/change-password`,
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { dToken } },
      );

      if (data.success) {
        setFeedback({ type: "success", message: data.message });
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        fetchSecurityLogs(); // Tải lại nhật ký để cập nhật vết thành công mới
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";
      setFeedback({ type: "error", message: errMsg });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleTerminateSession = (id) => {
    setSessions(sessions.filter((session) => session.id !== id));
    alert("Đã đăng xuất thiết bị thành công.");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldCheck className="text-primary w-7 h-7" />
          Cài đặt bảo mật tài khoản
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý dữ liệu mật khẩu cá nhân, theo dõi phiên hoạt động và giám sát
          lịch sử an toàn hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= CỘT TRÁI + GIỮA: ĐỔI MẬT KHẨU & 2FA ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* KHỐI 1: FORM ĐỔI MẬT KHẨU */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
              <KeyRound className="w-5 h-5 text-primary" />
              Thay đổi mật khẩu
            </h2>

            {feedback.message && (
              <div
                className={`p-3.5 rounded-xl flex items-center gap-2 text-sm font-medium border ${
                  feedback.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                <AlertCircle size={16} />
                {feedback.message}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Mật khẩu cũ */}
              <div className="relative">
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type={showPassword.old ? "text" : "password"}
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      oldPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 pr-10 text-sm outline-none focus:border-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({ ...showPassword, old: !showPassword.old })
                  }
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword.old ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Mật khẩu mới */}
              <div className="relative">
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type={showPassword.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 pr-10 text-sm outline-none focus:border-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({ ...showPassword, new: !showPassword.new })
                  }
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>

                {passwordData.newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} ${strength.width} transition-all duration-300`}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Độ mạnh:{" "}
                      <span className="font-semibold text-gray-700">
                        {strength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div className="relative">
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 pr-10 text-sm outline-none focus:border-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({
                      ...showPassword,
                      confirm: !showPassword.confirm,
                    })
                  }
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword.confirm ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="bg-primary text-white font-medium px-5 py-2.5 rounded-xl text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-400 disabled:scale-100 flex items-center gap-2"
              >
                {isSubmittingPassword && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                Cập nhật mật khẩu
              </button>
            </form>
          </div>

          {/* KHỐI 2: XÁC THỰC HAI LỚP (2FA) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Xác thực 2 lớp (2FA)
              </h2>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed max-w-md">
                Yêu cầu nhập mã bảo mật từ ứng dụng nhận diện (Google
                Authenticator) mỗi khi đăng nhập hệ thống.
              </p>
            </div>

            <button
              onClick={() => {
                setIs2FAEnabled(!is2FAEnabled);
                alert(
                  !is2FAEnabled
                    ? "Đã kích hoạt yêu cầu xác thực 2 lớp!"
                    : "Đã tắt xác thực 2 lớp.",
                );
              }}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none flex-shrink-0 ${
                is2FAEnabled ? "bg-green-500" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  is2FAEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* ================= CỘT PHẢI: QUẢN LÝ PHIÊN & LOGS ================= */}
        <div className="space-y-6">
          {/* KHỐI 3: THIẾT BỊ ĐANG ĐĂNG NHẬP */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
              <Monitor className="w-4 h-4 text-primary" />
              Thiết bị đang đăng nhập
            </h2>

            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                      {session.device}
                      {session.current && (
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">
                          Hiện tại
                        </span>
                      )}
                    </p>
                    <p className="text-gray-400">
                      IP: {session.ip} • {session.date}
                    </p>
                  </div>
                  {!session.current && (
                    <button
                      onClick={() => handleTerminateSession(session.id)}
                      className="text-rose-500 font-medium hover:underline"
                    >
                      Đăng xuất
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KHỐI 4: NHẬT KÝ HOẠT ĐỘNG BẢO MẬT (DỮ LIỆU REAl TIME TỪ API) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Lịch sử bảo mật hệ thống
              </h2>
              {isLoadingLogs && (
                <RefreshCw size={14} className="animate-spin text-gray-400" />
              )}
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {logs.length === 0 && !isLoadingLogs ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  Chưa ghi nhận hoạt động bảo mật nào.
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log._id}
                    className="space-y-1 text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">
                        {log.action}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          log.status === "Thành công"
                            ? "text-green-600 bg-green-50"
                            : "text-rose-600 bg-rose-50"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>IP: {log.ipAddress || "Không rõ"}</span>
                      <span>
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSecurity;
