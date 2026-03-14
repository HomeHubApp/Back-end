import bcrypt from "bcrypt";
import User from "../models/user.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import jsonwebtoken from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      email,
      isMfaActive: false,
    });
    await newUser.save();
    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error registering user",
      message: error,
    });
  }
};
export const login = async (req, res) => {
  const { username, password, rememberDevice } = req.body;
  const deviceToken = req.cookies?.trustedDevice; // <- optional chaining to avoid undefined

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

  // 1️Check if device is already trusted
  if (deviceToken) {
    const trusted = user.trustedDevices?.find(
      (d) => d.token === deviceToken && d.expires > Date.now()
    );
    if (trusted) {
      // Skip MFA completely
      const token = jsonwebtoken.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res.json({
        message: "Login successful (trusted device)",
        token,
        username: user.username,
        isMfaActive: user.isMfaActive,
      });
    }
  }

  // 2️ If MFA enabled → require OTP
  if (user.isMfaActive) {
    return res.status(200).json({
      message: "MFA required",
      mfaRequired: true,
      userId: user._id,
      rememberDevice, // pass this forward to verify2FA
    });
  }

  // 3️ No MFA → login normally
  const jwtToken = jsonwebtoken.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // 4️ Create trusted device if requested
  if (rememberDevice) {
    const newDeviceToken = crypto.randomBytes(32).toString("hex");
    user.trustedDevices.push({
      token: newDeviceToken,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      deviceInfo: req.headers["user-agent"],        // optional
    });
    await user.save();

    res.cookie("trustedDevice", newDeviceToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  return res.status(200).json({
    message: "Login successful",
    token: jwtToken,
    username: user.username,
    isMfaActive: user.isMfaActive,
  });
};
    const status = async (req, res) => {
    if (req.user) {
        res.status(200).json({
        message: "User logged in successfully",
        username: req.user.username,
        isMfaActive: req.user.isMfaActive,
        });
    } else {
        res.status(401).json({
        message: "User not logged in",
        });
    }
    };
const logout = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      message: "Unaithenticated user",
    });
  } else {
    req.logout((err) => {
      if (err) {
        res.status(400).json({
          message: "User not logged in",
        });
      }

      res.status(200).json({
        message: "User logged out successfully",
      });
    });
  }
};
const setup2FA = async (req, res) => {
  try {
    console.log(`The authenticated user is ${req.user}`);
    const user = req.user;
    const secret = speakeasy.generateSecret();
    console.log(`The secret is ${secret.base32}`);
    user.twoFactorSecret = secret.base32;

    user.isMfaActive = true;
    await user.save();

    const url = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `${req.user.username}`,
      issuer: "www.dipeshmalvia.com",
      encoding: "base32",
    });
    const qrImageUrl = await qrcode.toDataURL(url);
    res.status(200).json({
      secret: secret.base32,
      qrcode: qrImageUrl,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error Setting up 2FA for user",
      message: error,
    });
  }
};
export const verify2FA = async (req, res) => {
  const { token, userId, rememberDevice } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!user.twoFactorSecret) {
    return res.status(400).json({ message: "2FA not enabled for this user" });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: token,
    window: 1,
  });

  if (!verified) return res.status(400).json({ message: "Invalid OTP" });

  // Only create trusted device if user selected it
  if (rememberDevice) {
    const newDeviceToken = crypto.randomBytes(32).toString("hex");
    user.trustedDevices.push({
      token: newDeviceToken,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
      deviceInfo: req.headers["user-agent"],
    });
    await user.save();

    res.cookie("trustedDevice", newDeviceToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  const jwtToken = jsonwebtoken.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.status(200).json({
    message: "2FA verified successfully",
    token: jwtToken,
    username: user.username,
    isMfaActive: user.isMfaActive,
  });
};
const reset2FA = async (req, res) => {
  try {
    const user = req.user;
    user.isMfaActive = false;
    user.twoFactorSecret = "";
    await user.save();
    res.status(200).json({
      message: "2FA reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error resetting 2FA for user",
      message: error,
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    //generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    //hashtoken befre saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; //10mins

    await user.save();

    //send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Click here: ${resetUrl}`;

    await sendEmail(user.email, "Password Reset", message);

    res.status(200).json({ message: "Reset email sent" });
  } catch (error) {}
};

const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const { token } = req.params;

  try {
    //hash token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error resetting password",
      message: error,
    });
  }
};

const authController = {
  register,
  login,
  status,
  logout,
  setup2FA,
  verify2FA,
  reset2FA,
  forgotPassword,
  resetPassword,
};

export default authController;
