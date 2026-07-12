import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import { ArrowRight, Stethoscope } from "lucide-react";

const Diagnosis = () => {
  const location = useLocation();

  // TODO: đổi các key ảnh dưới đây cho khớp với tên thật trong src/assets/assets.js
  // (ví dụ: export const assets = { diabetes_image, malaria_image, ... }).
  // Nếu ảnh chưa tồn tại, giao diện sẽ tự hiện icon thay thế, không bị vỡ layout.
  const navItems = [
    {
      name: "TIỂU ĐƯỜNG",
      shortName: "Tiểu đường",
      path: "/diagnosis/diabetes",
      image: assets.diabetes_image,
      description:
        "Rối loạn chuyển hóa khiến đường huyết tăng cao kéo dài, cần theo dõi chỉ số đường huyết và chế độ ăn thường xuyên.",
    },
    {
      name: "SỐT RÉT",
      shortName: "Sốt rét",
      path: "/diagnosis/malaria",
      image: assets.malaria_image,
      description:
        "Bệnh truyền nhiễm do ký sinh trùng Plasmodium gây ra, lây qua muỗi Anopheles, thường gặp ở vùng nhiệt đới.",
    },
    {
      name: "VIÊM PHỔI",
      shortName: "Viêm phổi",
      path: "/diagnosis/pneumonia",
      image: assets.pneumonia_image,
      description:
        "Tình trạng nhiễm trùng nhu mô phổi gây ho, sốt, khó thở, có thể do vi khuẩn, virus hoặc nấm.",
    },
    {
      name: "ĐỘT QUỴ",
      shortName: "Đột quỵ",
      path: "/diagnosis/stroke",
      image: assets.stroke_image,
      description:
        "Tình trạng gián đoạn đột ngột lưu lượng máu lên não, cần được phát hiện và cấp cứu kịp thời.",
    },
    {
      name: "DA LIỄU",
      shortName: "Da liễu",
      path: "/diagnosis/skin",
      image: assets.skin_image,
      description:
        "Nhóm bệnh lý liên quan đến da, tóc, móng như dị ứng, viêm da, nấm da, mụn và các tổn thương ngoài da khác.",
    },
  ];

  const normalizedPath = location.pathname.replace(/\/$/, "");
  const isOverview = normalizedPath === "/diagnosis";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar: thanh ngang gọn trên mobile, sidebar dọc từ md trở lên */}
      <aside
        className="
          w-full md:w-64 md:flex-shrink-0
          bg-white border-b md:border-b-0 md:border-r shadow-sm
          sticky top-0 z-20
          md:h-screen md:overflow-y-auto
        "
      >
        <div className="px-2 py-2 md:px-5 md:py-6">
          <h2 className="hidden md:block text-lg font-bold text-gray-800 mb-6 px-3">
            Chẩn đoán
          </h2>

          <ul
            className="
              flex md:flex-col gap-1
              overflow-x-auto md:overflow-x-visible
              text-xs md:text-sm font-medium text-gray-700
              [-ms-overflow-style:none] [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {navItems.map((item) => (
              <li key={item.path} className="flex-shrink-0 md:flex-shrink">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block whitespace-nowrap text-center md:text-left px-2.5 py-1.5 md:px-3 md:py-2 rounded-md cursor-pointer transition-all hover:text-primary hover:bg-gray-50 border-b-4 md:border-b-0 md:border-l-4 ${
                      isActive
                        ? "text-primary bg-primary/10 border-primary font-semibold"
                        : "border-transparent"
                    }`
                  }
                >
                  <span className="md:hidden">{item.shortName}</span>
                  <span className="hidden md:inline">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex-1 w-full px-4 py-6 md:px-5 md:py-8 overflow-y-auto">
        {isOverview ? (
          <div className="mx-auto max-w-5xl">
            {/* Hero */}
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Stethoscope size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
                  Công cụ hỗ trợ chẩn đoán
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  Chọn một bệnh lý ở thanh bên để bắt đầu chẩn đoán, hoặc tìm
                  hiểu tổng quan bên dưới.
                </p>
              </div>
            </div>

            {/* Disease overview grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-primary/5">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.shortName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-primary/40">
                        <Stethoscope size={36} />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800">
                      {item.shortName}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                      {item.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Bắt đầu chẩn đoán
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default Diagnosis;
