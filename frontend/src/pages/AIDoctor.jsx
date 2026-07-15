import React, { useState } from "react";
import axios from "axios";
import {
  Stethoscope,
  Send,
  Bot,
  User,
  Loader2,
  ClipboardList,
  CheckCircle2,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
} from "lucide-react";
// Import file assets của bạn vào đây
import { assets } from "../assets/assets";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001/api/";

const AIDoctor = () => {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [diagnosis, setDiagnosis] = useState([]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    const newChats = [...chats, userMessage];

    setChats(newChats);
    setMessage("");
    setIsTyping(true);

    try {
      console.log(`Sending request to ${apiUrl}messages`);
      const response = await axios.post(
        `${apiUrl}messages`,
        { chats: newChats, system: "first" },
        { headers: { "Content-Type": "application/json" } },
      );

      const botResponse = response.data.response;

      setChats((prev) => [
        ...prev,
        { role: "assistant", content: botResponse.content },
      ]);

      if (response.data.diagnosis) {
        setDiagnosis(response.data.diagnosis);
      }
    } catch (error) {
      console.log("AI error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#FFFFFF] flex justify-center items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-10 items-center">
        {/* --- CỘT TRÁI: Banner & Giới thiệu (Hiển thị trên màn hình lớn) --- */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pr-8">
          <h1 className="text-3xl xl:text-4xl font-extrabold text-gray-800 leading-tight mb-6">
            Chẩn đoán thông minh <br />
            <span className="text-primary">cùng Bác sĩ AI</span>
          </h1>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Mô tả chi tiết triệu chứng của bạn để nhận được đánh giá y tế sơ bộ
            nhanh chóng, an toàn và bảo mật hoàn toàn 24/7.
          </p>

          {/* Thay đổi 'assets.header_img' thành tên biến ảnh thực tế 
            trong thư mục src/assets/assets.js của bạn 
          */}
          <img
            src={
              assets.Aidoctor ||
              "https://via.placeholder.com/600x400?text=Doctor+Illustration"
            }
            alt="AI Doctor Illustration"
            className="w-full max-w-lg object-contain drop-shadow-2xl rounded-2xl transition-transform hover:scale-105 duration-500"
          />
        </div>

        {/* --- CỘT PHẢI: Khung Chat AI --- */}
        <div className="w-full lg:w-1/2 bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 flex flex-col h-[700px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-5 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Bác sĩ AI</h1>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  Trực tuyến
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-primary transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-primary transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat body */}
          <div className="flex-1 overflow-y-auto space-y-5 px-2 custom-scrollbar">
            {/* Trạng thái trống được làm đẹp lại */}
            {chats.length === 0 && !isTyping && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-80 mt-[-20px]">
                {/* Bạn có thể đổi ảnh này thành một icon robot hoặc bác sĩ chibi từ assets */}
                <img
                  src={assets.about_image || "https://via.placeholder.com/150"}
                  alt="Empty chat"
                  className="w-32 h-32 object-cover rounded-full mb-2 shadow-md"
                />
                <h3 className="text-xl font-semibold text-gray-700">
                  Xin chào!
                </h3>
                <p className="text-gray-500 text-sm max-w-[280px]">
                  Tôi là trợ lý y tế AI. Hãy mô tả chi tiết triệu chứng bạn đang
                  gặp phải để tôi có thể hỗ trợ nhé.
                </p>
              </div>
            )}

            {chats.map((chat, index) => (
              <div
                key={index}
                className={
                  chat.role === "user"
                    ? "flex justify-end items-end gap-2"
                    : "flex justify-start items-end gap-2"
                }
              >
                {chat.role === "assistant" && (
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}

                <div
                  className={
                    chat.role === "user"
                      ? "bg-primary text-white rounded-2xl rounded-br-sm px-5 py-3 max-w-[75%] shadow-md text-sm leading-relaxed"
                      : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-5 py-3 max-w-[75%] text-sm leading-relaxed"
                  }
                >
                  {chat.role === "assistant"
                    ? JSON.parse(chat.content).message
                    : chat.content}
                </div>

                {chat.role === "user" && (
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-end gap-2">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-5 py-3 w-fit flex items-center gap-2 text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Đang phân tích dữ liệu...
                </div>
              </div>
            )}
          </div>

          {/* Diagnosis Kết quả tham khảo */}
          {diagnosis.length > 0 && (
            <div className="mt-4 bg-green-50/80 rounded-2xl p-4 border border-green-100 shrink-0">
              <h2 className="font-semibold text-base flex items-center gap-2 text-green-700 mb-2">
                <ClipboardList className="w-5 h-5" />
                Kết quả chẩn đoán sơ bộ
              </h2>
              <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {diagnosis.map((item, index) => (
                  <div key={index} className="mt-2.5 flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-800">
                        {index + 1}. {item.disease_name}
                      </p>
                      <p className="text-gray-600 mt-0.5 leading-relaxed">
                        {item.course_of_action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 mt-5 bg-gray-50 border border-gray-200 rounded-full px-2 py-2 shrink-0 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all"
          >
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 shrink-0 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 shrink-0 transition-colors hidden sm:flex"
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập triệu chứng của bạn..."
              className="flex-1 bg-transparent outline-none px-2 py-2 text-sm text-gray-700 placeholder-gray-400"
            />

            {message.trim() ? (
              <button
                type="submit"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-blue-700 shrink-0 shadow-md transition-transform active:scale-95"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 shrink-0 transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIDoctor;
