import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  BrainCircuit,
  Activity,
  HeartPulse,
} from "lucide-react";

const AIDiagnosis = () => {
  const navigate = useNavigate();

  // Danh sách các điểm nổi bật đồng bộ với phong cách AIDoctor
  const highlights = [
    {
      title: "Chẩn đoán thông minh",
      desc: "Phân tích triệu chứng dựa trên mô hình trí tuệ nhân tạo y tế chuyên sâu.",
      icon: <BrainCircuit className="w-5 h-5 text-primary" />,
      bgIcon: "bg-blue-50 border border-blue-100",
    },
    {
      title: "Hỗ trợ đa bệnh lý",
      desc: "Tích hợp sàng lọc Tiểu đường, Sốt rét, Viêm phổi, Đột quỵ và Da liễu.",
      icon: <Activity className="w-5 h-5 text-emerald-500" />,
      bgIcon: "bg-emerald-50 border border-emerald-100",
    },
    {
      title: "Kết quả tức thì",
      desc: "Nhận báo cáo đánh giá và hướng dẫn xử trí nguy cơ sức khỏe trực tuyến 24/7.",
      icon: <HeartPulse className="w-5 h-5 text-rose-500" />,
      bgIcon: "bg-rose-50 border border-rose-100",
    },
  ];

  return (
    <section className="my-16 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Khung chứa lớn sử dụng nền trắng, bóng đổ shadow-2xl và bo góc tròn tương tự như khung chat AIDoctor */}
      <div className="relative overflow-hidden bg-white p-8 md:p-14 lg:p-16">
        {/* Hiệu ứng hào quang mờ (Glow Effect) nhẹ nhàng theo tone xanh y tế */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl pointer-events-none opacity-60"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-50 rounded-full blur-3xl pointer-events-none opacity-60"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* CỘT TRÁI: Tiêu đề & Nút kêu gọi hành động (CTA) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 leading-tight tracking-tight">
              Trợ lý Sức khỏe AI <br />
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                Chẩn đoán trong tầm tay
              </span>
            </h2>

            <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Mô tả chi tiết triệu chứng của bạn để hệ thống tự động đối chiếu
              dữ liệu y khoa, đưa ra các cảnh báo nguy cơ và định hướng xử trí
              kịp thời.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => {
                  navigate("/diagnosis");
                  window.scrollTo(0, 0);
                }}
                className="group flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition-all duration-300 active:scale-95"
              >
                Bắt đầu chẩn đoán
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>

              <button
                onClick={() => {
                  navigate("/diagnosis");
                  window.scrollTo(0, 0);
                }}
                className="flex items-center justify-center px-6 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Xem các chuyên khoa
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: Khối các tính năng nổi bật (Đồng bộ style với tin nhắn Chat) */}
          <div className="lg:col-span-5 space-y-4">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  navigate("/diagnosis");
                  window.scrollTo(0, 0);
                }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div
                  className={`flex-shrink-0 p-3 rounded-full ${item.bgIcon} group-hover:scale-105 transition-transform`}
                >
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-base text-gray-800 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDiagnosis;
