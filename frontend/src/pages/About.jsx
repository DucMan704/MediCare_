import React from "react";
import { assets } from "../assets/assets";
import { Eye, Clock, ShieldCheck, HeartHandshake } from "lucide-react";

const About = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tiêu đề Giới thiệu */}
      <div className="text-center text-3xl pt-10 pb-4 text-gray-500">
        <p>
          GIỚI THIỆU{" "}
          <span className="text-gray-800 font-bold">VỀ CHÚNG TÔI</span>
        </p>
        {/* Đường gạch chân trang trí */}
        <div className="w-24 h-1 bg-primary mx-auto mt-3 rounded-full"></div>
      </div>

      {/* Phần Nội dung Giới thiệu */}
      <div className="my-10 flex flex-col lg:flex-row gap-12 items-center">
        {/* Hình ảnh có hiệu ứng hover scale nhẹ */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            className="w-full max-w-[450px] rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-500 object-cover"
            src={assets.about_image}
            alt="About MediCare"
          />
        </div>

        {/* Nội dung Text */}
        <div className="flex flex-col justify-center gap-6 lg:w-1/2 text-base text-gray-600 leading-relaxed">
          <p>
            Chào mừng bạn đến với{" "}
            <strong className="text-primary font-semibold">MediCare</strong> —
            đối tác đáng tin cậy trong việc quản lý nhu cầu chăm sóc sức khỏe
            một cách thuận tiện và hiệu quả. Tại MediCare, chúng tôi hiểu những
            thách thức mà mỗi người gặp phải khi đặt lịch khám bác sĩ và quản lý
            hồ sơ sức khỏe cá nhân.
          </p>
          <p>
            MediCare cam kết xuất sắc trong công nghệ y tế. Chúng tôi không
            ngừng cải tiến nền tảng, tích hợp những tiến bộ mới nhất để nâng cao
            trải nghiệm người dùng và cung cấp dịch vụ chất lượng cao. Dù bạn
            đặt lịch khám lần đầu hay quản lý quá trình điều trị dài hạn,
            MediCare luôn đồng hành cùng bạn.
          </p>

          {/* Hộp Tầm nhìn được làm nổi bật */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm mt-2 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <Eye className="text-primary w-6 h-6" />
              <b className="text-gray-800 text-lg">Tầm nhìn</b>
            </div>
            <p className="text-sm">
              Tầm nhìn của MediCare là tạo ra trải nghiệm chăm sóc sức khỏe liền
              mạch cho mọi người. Chúng tôi hướng tới việc thu hẹp khoảng cách
              giữa bệnh nhân và cơ sở y tế, giúp bạn tiếp cận dịch vụ chăm sóc
              đúng lúc, đúng nhu cầu.
            </p>
          </div>
        </div>
      </div>

      {/* Tiêu đề Tại sao chọn chúng tôi */}
      <div className="text-center text-2xl mt-16 mb-10 text-gray-500">
        <p>
          TẠI SAO{" "}
          <span className="text-gray-800 font-bold">CHỌN CHÚNG TÔI</span>
        </p>
        <div className="w-20 h-1 bg-primary mx-auto mt-3 rounded-full"></div>
      </div>

      {/* Phần Dịch vụ / Tính năng (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {/* Card 1: Hiệu quả */}
        <div className="group border border-gray-200 rounded-2xl px-8 py-12 flex flex-col items-center text-center gap-5 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white">
          <div className="p-4 bg-primary/10 rounded-full group-hover:bg-white/20 transition-colors duration-300">
            <Clock className="w-8 h-8 text-primary group-hover:text-white" />
          </div>
          <b className="text-lg text-gray-800 group-hover:text-white">
            HIỆU QUẢ
          </b>
          <p className="text-sm leading-relaxed text-gray-500 group-hover:text-white/90">
            Quy trình đặt lịch khám tối ưu, phù hợp với lịch trình bận rộn của
            bạn.
          </p>
        </div>

        {/* Card 2: Tiện lợi */}
        <div className="group border border-gray-200 rounded-2xl px-8 py-12 flex flex-col items-center text-center gap-5 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white">
          <div className="p-4 bg-primary/10 rounded-full group-hover:bg-white/20 transition-colors duration-300">
            <ShieldCheck className="w-8 h-8 text-primary group-hover:text-white" />
          </div>
          <b className="text-lg text-gray-800 group-hover:text-white">
            TIỆN LỢI
          </b>
          <p className="text-sm leading-relaxed text-gray-500 group-hover:text-white/90">
            Tiếp cận mạng lưới bác sĩ và chuyên gia y tế uy tín trong khu vực.
          </p>
        </div>

        {/* Card 3: Cá nhân hóa */}
        <div className="group border border-gray-200 rounded-2xl px-8 py-12 flex flex-col items-center text-center gap-5 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white">
          <div className="p-4 bg-primary/10 rounded-full group-hover:bg-white/20 transition-colors duration-300">
            <HeartHandshake className="w-8 h-8 text-primary group-hover:text-white" />
          </div>
          <b className="text-lg text-gray-800 group-hover:text-white">
            CÁ NHÂN HÓA
          </b>
          <p className="text-sm leading-relaxed text-gray-500 group-hover:text-white/90">
            Gợi ý và nhắc nhở phù hợp giúp bạn chủ động theo dõi sức khỏe.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
