import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const authUser = async (req, res, next) => {
  try {
    // Lấy token trực tiếp từ req.headers.token (frontend gửi)
    // Hoặc lấy từ Authorization (để dự phòng nếu có chỗ nào dùng Bearer)
    const token =
      req.headers.token ||
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

      // find user
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // trả user trong req
      req.user = user;
      // Trả thêm userId vào body nếu các controller khác của bạn đang cần req.body.userId
      req.body.userId = decoded.id;

      next();
    });
  } catch (error) {
    console.error("Error in authUser middleware:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default authUser;
