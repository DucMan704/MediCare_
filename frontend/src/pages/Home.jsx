import React from "react";
import { motion } from "framer-motion";

import Header from "../components/Header";
import SpecialityMenu from "../components/SpecialityMenu";
import TopDoctors from "../components/TopDoctors";
import Banner from "../components/Banner";
import AIChatButton from "../components/AIChatButton";
import AIDoctor from "./AIDoctor";
import AIDiagnosis from "../components/AI_Diagnosis";

// --- Component Helper: Bọc các section để tạo hiệu ứng trượt lên khi cuộn ---
const FadeInScroll = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }} // Bắt đầu: Mờ (opacity 0) và tụt xuống dưới 60px
      whileInView={{ opacity: 1, y: 0 }} // Khi cuộn tới: Rõ dần (opacity 1) và trượt lên vị trí gốc
      viewport={{ once: true, margin: "-100px" }} // Chỉ chạy 1 lần, kích hoạt khi mép dưới màn hình cách phần tử 100px
      transition={{ duration: 0.8, ease: "easeOut", delay: delay }} // Tốc độ mượt mà
    >
      {children}
    </motion.div>
  );
};

const Home = () => {
  return (
    <div className="overflow-hidden">
      {/* Header thường nằm trên cùng nên cho hiện ngay lập tức, không cần đợi cuộn */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Header />
      </motion.div>

      {/* Các thành phần bên dưới sẽ tự động ẩn hiện khi người dùng cuộn trang */}
      <FadeInScroll>
        <SpecialityMenu />
      </FadeInScroll>

      <FadeInScroll>
        <TopDoctors />
      </FadeInScroll>

      <FadeInScroll>
        <AIDoctor />
      </FadeInScroll>

      <FadeInScroll>
        <AIDiagnosis />
      </FadeInScroll>

      <FadeInScroll>
        <Banner />
      </FadeInScroll>

      {/* Nút chat AI giữ nguyên không cần bọc để nó luôn lơ lửng (fixed) */}
      <AIChatButton />
    </div>
  );
};

export default Home;
