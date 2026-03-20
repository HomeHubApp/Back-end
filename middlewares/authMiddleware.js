import jsonwebtoken from "jsonwebtoken";
import { findUserByTrustedDevice } from "../services/userService.js";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized",
      success: false,
    });
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId,
      username: decoded.username,
      isAdmin: decoded.isAdmin || false,
    };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired — please log in again",
      });
    }
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};

export const trustedDeviceProtect = async (req, res, next) => {
  try {
    const deviceToken = req.cookies?.trustedDevice;

    if (!deviceToken) {
      return res.status(401).json({
        success: false,
        message: "Device not trusted",
      });
    }

    const user = await findUserByTrustedDevice(deviceToken);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Device not trusted",
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin || false,
    };
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const optionalAuth = (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      isAdmin: decoded.isAdmin || false,
    };
  } catch {}

  next();
};
