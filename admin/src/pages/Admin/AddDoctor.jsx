import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";
import axios from "axios";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import { specialityList } from "../../utils/i18n";

// Import bộ icon từ lucide-react để giao diện thêm sinh động
import {
  User,
  Mail,
  Lock,
  Briefcase,
  DollarSign,
  Stethoscope,
  GraduationCap,
  MapPin,
  AlignLeft,
  Camera,
  UserPlus,
  Loader2,
  ImagePlus,
} from "lucide-react";

const AddDoctor = () => {
  // --- STATE QUẢN LÝ DỮ LIỆU FORM ---
  const [docImg, setDocImg] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [experience, setExperience] = useState("1 Year");
  const [fees, setFees] = useState("");
  const [about, setAbout] = useState("");
  const [speciality, setSpeciality] = useState("Bác sĩ đa khoa");
  const [degree, setDegree] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  // --- STATE QUẢN LÝ UX (Hiệu ứng Loading) ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { backendUrl } = useContext(AppContext);
  const { aToken } = useContext(AdminContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setIsSubmitting(true); // Bật hiệu ứng loading khóa nút bấm

    try {
      if (!docImg) {
        setIsSubmitting(false);
        return toast.error("Vui lòng tải lên ảnh đại diện của bác sĩ!");
      }

      const formData = new FormData();
      formData.append("image", docImg);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("experience", experience);
      formData.append("fees", Number(fees));
      formData.append("about", about);
      formData.append("speciality", speciality);
      formData.append("degree", degree);
      formData.append(
        "address",
        JSON.stringify({ line1: address1, line2: address2 }),
      );

      const { data } = await axios.post(
        backendUrl + "/api/admin/add-doctor",
        formData,
        { headers: { aToken } },
      );

      if (data.success) {
        toast.success(data.message);
        // Reset form sau khi thêm thành công
        setDocImg(false);
        setName("");
        setPassword("");
        setEmail("");
        setAddress1("");
        setAddress2("");
        setDegree("");
        setAbout("");
        setFees("");
        setExperience("1 Year");
        setSpeciality("Bác sĩ đa khoa");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Có lỗi xảy ra",
      );
      console.log(error);
    } finally {
      setIsSubmitting(false); // Tắt hiệu ứng loading
    }
  };

  return (
    // Sử dụng w-full để kéo form rộng ra theo màn hình
    <div className="w-full py-6 px-4 md:px-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
      {/* --- HEADER --- */}
      <div className="mb-6 w-full">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="text-primary" size={28} />
          Thêm Bác sĩ Mới
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tạo hồ sơ chuyên môn và cấp tài khoản cho bác sĩ vào hệ thống
        </p>
      </div>

      {/* --- FORM CHÍNH --- */}
      <form
        onSubmit={onSubmitHandler}
        className="bg-white p-6 md:p-10 border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-full"
      >
        {/* --- KHU VỰC TẢI ẢNH ĐẠI DIỆN --- */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 pb-8 border-b border-gray-100">
          <div className="relative group shrink-0">
            <img
              className={`w-32 h-32 rounded-full object-cover border-4 shadow-md transition-all duration-300 ${docImg ? "border-primary" : "border-gray-100"}`}
              src={docImg ? URL.createObjectURL(docImg) : assets.upload_area}
              alt="Avatar Upload"
            />
            <label
              htmlFor="doc-img"
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-300 backdrop-blur-sm"
            >
              {docImg ? (
                <Camera className="text-white mb-1" size={24} />
              ) : (
                <ImagePlus className="text-white mb-1" size={24} />
              )}
              <span className="text-white text-xs font-medium">
                {docImg ? "Đổi ảnh" : "Tải ảnh"}
              </span>
            </label>
            <input
              onChange={(e) => setDocImg(e.target.files[0])}
              type="file"
              id="doc-img"
              accept="image/*"
              hidden
            />
          </div>
          <div className="text-center sm:text-left flex flex-col gap-1.5">
            <h3 className="text-lg font-bold text-gray-800">
              Ảnh đại diện <span className="text-rose-500">*</span>
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Vui lòng chọn ảnh chụp rõ khuôn mặt, tỷ lệ vuông (1:1), định dạng
              JPG, PNG hoặc WEBP.
            </p>
            {docImg && (
              <button
                type="button"
                onClick={() => setDocImg(false)}
                className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors w-fit mx-auto sm:mx-0 mt-1"
              >
                Xóa ảnh đã chọn
              </button>
            )}
          </div>
        </div>

        {/* --- GRID THÔNG TIN: Chia 2 cột rộng rãi --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 w-full">
          {/* CỘT TRÁI: THÔNG TIN TÀI KHOẢN & CƠ BẢN */}
          <div className="flex flex-col gap-6 w-full">
            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <User size={16} className="text-primary" /> Họ và tên{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                type="text"
                placeholder="VD: Nguyễn Văn A"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Mail size={16} className="text-primary" /> Email đăng nhập{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                type="email"
                placeholder="doctor@medicare.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Lock size={16} className="text-primary" /> Mật khẩu khởi tạo{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
                type="password"
                placeholder="Nhập mật khẩu an toàn..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Briefcase size={16} className="text-primary" /> Kinh nghiệm
              </label>
              <select
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm cursor-pointer appearance-none"
              >
                {Array.from({ length: 15 }, (_, i) => (
                  <option key={i} value={`${i + 1} Year`}>
                    {i + 1} năm kinh nghiệm
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CỘT PHẢI: CHUYÊN MÔN & ĐỊA CHỈ */}
          <div className="flex flex-col gap-6 w-full">
            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Stethoscope size={16} className="text-primary" /> Chuyên khoa
              </label>
              <select
                onChange={(e) => setSpeciality(e.target.value)}
                value={speciality}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm cursor-pointer appearance-none"
              >
                {specialityList.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <GraduationCap size={16} className="text-primary" /> Bằng cấp /
                Học vị <span className="text-rose-500">*</span>
              </label>
              <input
                onChange={(e) => setDegree(e.target.value)}
                value={degree}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                type="text"
                placeholder="VD: Thạc sĩ, Tiến sĩ, Bác sĩ CKI..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-primary" /> Phí khám bệnh{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  onChange={(e) => setFees(e.target.value)}
                  value={fees}
                  className="w-full border border-gray-200 rounded-xl pl-4 pr-16 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  type="number"
                  min="0"
                  placeholder="0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm pointer-events-none">
                  VNĐ
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-primary" /> Nơi công tác / Địa
                chỉ phòng khám <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col gap-3">
                <input
                  onChange={(e) => setAddress1(e.target.value)}
                  value={address1}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  type="text"
                  placeholder="Tòa nhà, số nhà, tên đường..."
                  required
                />
                <input
                  onChange={(e) => setAddress2(e.target.value)}
                  value={address2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  type="text"
                  placeholder="Quận/Huyện, Tỉnh/Thành phố (Tùy chọn)..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- KHU VỰC GIỚI THIỆU (FULL WIDTH) --- */}
        <div className="mt-8 pt-8 border-t border-gray-100 w-full">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <AlignLeft size={16} className="text-primary" /> Giới thiệu về Bác
              sĩ (Thông tin hiển thị trên app)
            </label>
            <span
              className={`text-xs font-semibold ${about.length > 500 ? "text-amber-500" : "text-gray-400"}`}
            >
              {about.length} ký tự
            </span>
          </div>
          <textarea
            onChange={(e) => setAbout(e.target.value)}
            value={about}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm leading-relaxed resize-y custom-scrollbar"
            placeholder="Mô tả tóm tắt quá trình công tác, thành tựu, các loại bệnh điều trị chuyên sâu..."
            rows={5}
            required
          />
        </div>

        {/* --- NÚT SUBMIT --- */}
        <div className="mt-10 w-full flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-12 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/30 active:scale-95 text-base ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Đang tạo hồ sơ...
              </>
            ) : (
              <>
                <UserPlus size={20} /> Xác nhận Thêm Bác sĩ
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDoctor;
