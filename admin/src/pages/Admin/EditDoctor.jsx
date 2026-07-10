import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";
import { specialityList } from "../../utils/i18n";

import {
  User,
  Mail,
  Briefcase,
  DollarSign,
  Stethoscope,
  GraduationCap,
  MapPin,
  AlignLeft,
  Camera,
  Save,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const EditDoctor = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { aToken, getDoctorById, updateDoctor } = useContext(AdminContext);

  const [docImg, setDocImg] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("1 Year");
  const [fees, setFees] = useState("");
  const [about, setAbout] = useState("");
  const [speciality, setSpeciality] = useState("Bác sĩ đa khoa");
  const [degree, setDegree] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!aToken) return;
      const doc = await getDoctorById(doctorId);
      if (doc) {
        setName(doc.name || "");
        setEmail(doc.email || "");
        setExperience(doc.experience || "1 Year");
        setFees(doc.fees || "");
        setAbout(doc.about || "");
        setSpeciality(doc.speciality || "Bác sĩ đa khoa");
        setDegree(doc.degree || "");
        setCurrentImage(doc.image || "");
        try {
          const parsedAddress =
            typeof doc.address === "string"
              ? JSON.parse(doc.address)
              : doc.address;
          setAddress1(parsedAddress?.line1 || "");
          setAddress2(parsedAddress?.line2 || "");
        } catch {
          setAddress1("");
          setAddress2("");
        }
      } else {
        toast.error("Không tìm thấy thông tin bác sĩ");
        navigate("/doctor-list");
      }
      setLoading(false);
    };

    fetchDoctor();
  }, [aToken, doctorId, getDoctorById, navigate]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("doctorId", doctorId);
      if (docImg) formData.append("image", docImg);
      formData.append("name", name);
      formData.append("experience", experience);
      formData.append("fees", Number(fees));
      formData.append("about", about);
      formData.append("speciality", speciality);
      formData.append("degree", degree);
      formData.append(
        "address",
        JSON.stringify({ line1: address1, line2: address2 }),
      );

      const success = await updateDoctor(formData);
      if (success) {
        toast.success("Cập nhật hồ sơ thành công!");
        navigate("/doctor-list");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu dữ liệu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-medium text-lg">Đang tải hồ sơ bác sĩ...</p>
      </div>
    );
  }

  return (
    // Đổi m-5 sang w-full px-4 md:px-8 để bung lề rộng ra sát mép thanh điều hướng
    <div className="w-full py-6 px-4 md:px-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
      {/* --- BREADCRUMB & HEADER --- */}
      <div className="flex items-center gap-4 mb-6 w-full">
        <button
          onClick={() => navigate("/doctor-list")}
          className="p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 hover:text-primary transition-colors shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa hồ sơ</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Cập nhật thông tin chi tiết của bác sĩ vào hệ thống
          </p>
        </div>
      </div>

      {/* --- FORM CHÍNH: Đổi max-w-5xl thành max-w-full để co giãn hết cỡ --- */}
      <form
        onSubmit={onSubmitHandler}
        className="bg-white p-6 md:p-10 border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-full"
      >
        {/* --- KHU VỰC CẬP NHẬT ẢNH --- */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 pb-8 border-b border-gray-100">
          <div className="relative group shrink-0">
            <img
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg group-hover:opacity-80 transition-opacity"
              src={
                docImg
                  ? URL.createObjectURL(docImg)
                  : currentImage || "https://via.placeholder.com/150"
              }
              alt="Avatar"
            />
            <label
              htmlFor="doc-img"
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300"
            >
              <Camera className="text-white mb-1" size={24} />
              <span className="text-white text-xs font-medium">Đổi ảnh</span>
            </label>
            <input
              onChange={(e) => setDocImg(e.target.files[0])}
              type="file"
              id="doc-img"
              accept="image/*"
              hidden
            />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Ảnh đại diện
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Nên sử dụng ảnh vuông, rõ mặt, định dạng JPG hoặc PNG. Tối đa 2MB.
            </p>
            {docImg && (
              <button
                type="button"
                onClick={() => setDocImg(false)}
                className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
              >
                Hủy ảnh mới chọn
              </button>
            )}
          </div>
        </div>

        {/* --- GRID THÔNG TIN: Giữ cấu trúc 2 cột nhưng độ rộng của cột sẽ kéo dài theo màn hình --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 w-full">
          {/* Cột Trái */}
          <div className="flex flex-col gap-6 w-full">
            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <User size={16} className="text-primary" /> Họ và tên
              </label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                type="text"
                placeholder="VD: Nguyễn Văn A"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Mail size={16} className="text-gray-400" /> Email hệ thống
              </label>
              <div className="relative">
                <input
                  value={email}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  type="email"
                  disabled
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded">
                  KHÔNG THỂ ĐỔI
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Briefcase size={16} className="text-primary" /> Kinh nghiệm
              </label>
              <select
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm cursor-pointer appearance-none"
              >
                {Array.from({ length: 15 }, (_, i) => (
                  <option key={i} value={`${i + 1} Year`}>
                    {i + 1} năm kinh nghiệm
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-primary" /> Phí khám bệnh
              </label>
              <div className="relative">
                <input
                  onChange={(e) => setFees(e.target.value)}
                  value={fees}
                  className="w-full border border-gray-200 rounded-xl pl-4 pr-16 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
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
          </div>

          {/* Cột Phải */}
          <div className="flex flex-col gap-6 w-full">
            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Stethoscope size={16} className="text-primary" /> Chuyên khoa
              </label>
              <select
                onChange={(e) => setSpeciality(e.target.value)}
                value={speciality}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm cursor-pointer appearance-none"
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
                Học vị
              </label>
              <input
                onChange={(e) => setDegree(e.target.value)}
                value={degree}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                type="text"
                placeholder="VD: Thạc sĩ, Tiến sĩ, CKI..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-primary" /> Nơi công tác / Địa
                chỉ phòng khám
              </label>
              <div className="flex flex-col gap-3">
                <input
                  onChange={(e) => setAddress1(e.target.value)}
                  value={address1}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  type="text"
                  placeholder="Tòa nhà, số nhà, tên đường..."
                  required
                />
                <input
                  onChange={(e) => setAddress2(e.target.value)}
                  value={address2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  type="text"
                  placeholder="Quận/Huyện, Tỉnh/Thành phố..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- KHU VỰC GIỚI THIỆU (FULL WIDTH THEO CHIỀU NGANG MỚI) --- */}
        <div className="mt-8 pt-8 border-t border-gray-100 w-full">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <AlignLeft size={16} className="text-primary" /> Giới thiệu về Bác
              sĩ
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
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm leading-relaxed resize-y custom-scrollbar"
            placeholder="Viết một đoạn ngắn giới thiệu về chuyên môn..."
            rows={6}
            required
          />
        </div>

        {/* --- NÚT HÀNH ĐỘNG --- */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full">
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-12 py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save size={18} /> Lưu thay đổi
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => navigate("/doctor-list")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-700 font-bold px-12 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
          >
            <X size={18} /> Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDoctor;
