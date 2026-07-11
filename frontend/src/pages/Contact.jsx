import React, { useState } from "react";
import { assets } from "../assets/assets";
// Import các icon cần thiết từ lucide-react
import {
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Send,
  CheckCircle2,
} from "lucide-react";

const Contact = () => {
  // State quản lý dữ liệu form liên hệ
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Hàm xử lý khi người dùng nhập liệu
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Hàm xử lý gửi form
  const handleSubmit = (e) => {
    e.preventDefault();
    // Giả lập gửi API thành công
    console.log("Dữ liệu liên hệ gửi đi:", formData);
    setIsSubmitted(true);
    // Reset form sau 3 giây
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", message: "" });
    }, 4000);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
      {/* --- TIÊU ĐỀ TRANG --- */}
      <div className="text-center text-3xl pt-10 pb-6 text-gray-500 font-light">
        <p>
          LIÊN HỆ <span className="text-gray-800 font-bold">CHÚNG TÔI</span>
        </p>
        <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
      </div>

      {/* --- BỐ CỤC CHÍNH --- */}
      <div className="my-12 grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-start mb-28">
        {/* KHỐI 1: HÌNH ẢNH & THÔNG TIN LIÊN HỆ (Chiếm 5/12 cột) */}
        <div className="md:col-span-5 flex flex-col gap-8">
          {/* Hình ảnh với hiệu ứng bo góc mềm mại */}
          <div className="overflow-hidden rounded-2xl shadow-lg group">
            <img
              className="w-full h-64 md:h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              src={assets.contact_image}
              alt="Liên hệ MediCare"
            />
          </div>

          {/* Chi tiết thông tin văn phòng */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b pb-2 border-gray-100">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              <p className="font-bold text-lg text-gray-800 tracking-wide">
                VĂN PHÒNG
              </p>
            </div>

            {/* Địa chỉ */}
            <div className="flex items-start gap-4 text-gray-600">
              <div className="p-2 bg-blue-50 text-primary rounded-lg shrink-0">
                <MapPin size={18} />
              </div>
              <p className="text-[15px] leading-relaxed">
                350 Nguyễn Văn Linh, <br />
                Phường Hải Châu, Thành phố Đà Nẵng
              </p>
            </div>

            {/* Điện thoại & Email */}
            <div className="flex flex-col gap-3 text-gray-600 border-t pt-4 border-gray-100">
              <div className="flex items-center gap-4 text-[15px]">
                <div className="p-2 bg-blue-50 text-primary rounded-lg shrink-0">
                  <Phone size={18} />
                </div>
                <p>
                  Điện thoại:{" "}
                  <span className="font-medium text-gray-800">
                    (415) 555-0132
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4 text-[15px]">
                <div className="p-2 bg-blue-50 text-primary rounded-lg shrink-0">
                  <Mail size={18} />
                </div>
                <p>
                  Email:{" "}
                  <span className="font-medium text-gray-800">
                    medicare@gmail.com
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KHỐI 2: CHỨC NĂNG GỬI LỜI NHẮN & TUYỂN DỤNG (Chiếm 7/12 cột) */}
        <div className="md:col-span-7 flex flex-col gap-8">
          {/* TÍNH NĂNG THÊM MỚI: FORM GỬI TIN NHẮN LIÊN HỆ */}
          <div className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-2xl border border-gray-100 shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Gửi lời nhắn cho chúng tôi
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng để lại thông tin bên dưới.
            </p>

            {isSubmitted ? (
              // Trạng thái gửi thành công
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl flex items-center gap-3 animate-fade-in">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                <div>
                  <p className="font-semibold">Cảm ơn bạn đã liên hệ!</p>
                  <p className="text-sm text-emerald-700/90 mt-0.5">
                    Lời nhắn của bạn đã được gửi đi thành công. Chúng tôi sẽ
                    phản hồi sớm nhất.
                  </p>
                </div>
              </div>
            ) : (
              // Biểu mẫu nhập liệu
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email liên hệ
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@gmail.com"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nội dung lời nhắn
                  </label>
                  <textarea
                    name="message"
                    required
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Nhập nội dung bạn cần hỗ trợ hoặc hợp tác..."
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white font-medium rounded-xl px-6 py-3.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all self-end mt-2 w-full sm:w-auto"
                >
                  <Send size={16} /> Gửi lời nhắn
                </button>
              </form>
            )}
          </div>

          {/* BOX TUYỂN DỤNG */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <div className="p-3 bg-amber text-amber-600 rounded-xl shrink-0 mt-1">
                <Briefcase size={24} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-bold text-lg text-gray-800 tracking-wide">
                  TUYỂN DỤNG TẠI MEDICARE
                </p>
                <p className="text-gray-500 text-[14px] leading-relaxed max-w-md">
                  Tìm hiểu thêm về đội ngũ năng động và các cơ hội việc làm hấp
                  dẫn đang chờ đón bạn.
                </p>
              </div>
            </div>

            <button className="border-2 border-gray-800 text-gray-800 font-medium px-6 py-3 rounded-xl text-sm hover:bg-gray-800 hover:text-white transition-all duration-300 whitespace-nowrap active:scale-95 shadow-sm">
              Khám phá việc làm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
