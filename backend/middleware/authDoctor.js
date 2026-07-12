import jwt from "jsonwebtoken";
import Doctor from "../models/doctorModel.js";

const authDoctor = async (req, res, next) => {
  try {
    // SỬA Ở ĐÂY: Lấy token từ header 'dtoken' (do frontend gửi)
    // Giữ lại thêm 'authorization' để dự phòng nếu bạn test bằng Postman
    const token =
      req.headers.dtoken ||
      (req.headers["authorization"] &&
        req.headers["authorization"].split(" ")[1]);

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access Denied: No access token provided" });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Access Denied: Invalid access token" });
      }

      // find doctor
      const doctor = await Doctor.findById(decoded.id).select("-password");

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // trả doctor trong req
      req.doctor = doctor;

      // các hàm controller của bạn đang gọi lấy id từ req.body.docId
      req.body.docId = decoded.id;

      next();
    });
  } catch (error) {
    console.error("Error in authDoctor middleware:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default authDoctor;
