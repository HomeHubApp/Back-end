// authController.js
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByResetToken,
  updateUser2FA,
  updateUserTrustedDevices,
  updateUserPassword,
  updateUserResetToken,
  updateUserLastLogin,
} from "../services/userService.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
};

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000, // 1 hour
  });
};

const setTrustedDeviceCookie = (res, deviceToken) => {
  res.cookie("trustedDevice", deviceToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

const signJwt = (user) =>
  jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  //goodness
// export const register = async (req, res) => {
//   try {
//     let { fullname, email, password, confirmPassword } = req.body; 

//     if (!fullname || !email || !password || !confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     fullname = fullname.trim();
//     email = email.trim().toLowerCase();
//     password = password.trim();
//     confirmPassword = confirmPassword.trim();

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email address",
//       });
//     }

//     if (password.length < 8) {
//       return res.status(400).json({
//         success: false,
//         message: "Password must be at least 8 characters",
//       });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         message: "Passwords do not match",
//       });
//     }

//     const existingUser = await findUserByEmail(email);
//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: "Email is already in use",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);
//     await createUser({ fullname, email, password: hashedPassword }); 

//     return res.status(201).json({
//       success: true,
//       message: "Account created successfully",
//     });
//   } catch (error) {
//     console.error("REGISTER ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error registering user",
//     });
//   }
// };


export const login = async (req, res) => {
  try {
    const { email, password, rememberDevice } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await findUserByEmail(email.trim().toLowerCase());

    // Same message for wrong email and wrong password —
    // telling an attacker which one is correct helps them enumerate accounts
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ── Trusted device check ──────────────────────────────────────────────────
    // If the user has a trusted device cookie, verify it against the DB.
    // If valid, skip MFA and issue a JWT immediately.
    const deviceToken = req.cookies?.trustedDevice;
    if (deviceToken) {
      const trustedDevices = user.trusted_devices || [];
      const trusted = trustedDevices.find(
        (d) => d.token === deviceToken && new Date(d.expires) > new Date(),
      );
      if (trusted) {
        await updateUserLastLogin(user.id);
        const token = signJwt(user);
        setAuthCookie(res, token);
        return res.status(200).json({
          success: true,
          message: "Login successful",
          username: user.username,
          isMfaActive: user.is_mfa_active,
        });
      }
    }

    // ── MFA check ─────────────────────────────────────────────────────────────
    // Don't issue a JWT yet — frontend needs to collect the OTP first.
    // We send back the userId so verify2FA knows who to verify.
    if (user.is_mfa_active) {
      return res.status(200).json({
        success: true,
        message: "MFA required",
        mfaRequired: true,
        userId: user.id,
      });
    }

    // ── Standard login ────────────────────────────────────────────────────────
    if (rememberDevice) {
      const newDeviceToken = crypto.randomBytes(32).toString("hex");

      // Prune any expired devices before adding the new one
      const existing = (user.trusted_devices || []).filter(
        (d) => new Date(d.expires) > new Date(),
      );
      const updatedDevices = [
        ...existing,
        {
          token: newDeviceToken,
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          deviceInfo: req.headers["user-agent"] || "unknown",
        },
      ];

      await updateUserTrustedDevices(user.id, updatedDevices);
      setTrustedDeviceCookie(res, newDeviceToken);
    }

    await updateUserLastLogin(user.id);
    const token = signJwt(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      username: user.username,
      isMfaActive: user.is_mfa_active,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Error logging in",
    });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// JWT auth means logout is just clearing cookies — no DB call needed.
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", cookieOptions);
    res.clearCookie("trustedDevice", cookieOptions);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Error logging out",
    });
  }
};

// ─── Setup 2FA ────────────────────────────────────────────────────────────────
export const setup2FA = async (req, res) => {
  try {
    // req.user only has id and username from the JWT —
    // fetch the full row to check is_mfa_active
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.is_mfa_active) {
      return res.status(400).json({
        success: false,
        message: "2FA is already enabled",
      });
    }

    const secret = speakeasy.generateSecret({ length: 20 });
    await updateUser2FA(user.id, secret.base32, true);

    const url = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.username || user.email,
      issuer: process.env.APP_NAME || "HomeHub",
      encoding: "base32",
    });

    const qrImageUrl = await qrcode.toDataURL(url);

    return res.status(200).json({
      success: true,
      message: "2FA setup successfully",
      qrcode: qrImageUrl,
    });
  } catch (error) {
    console.error("SETUP 2FA ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Error setting up 2FA",
    });
  }
};

// ─── Verify 2FA ───────────────────────────────────────────────────────────────
export const verify2FA = async (req, res) => {
  try {
    const { token, userId, rememberDevice } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "OTP token is required",
      });
    }

    // userId comes from the login response body — not from JWT
    // because the user doesn't have a JWT yet at this point
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.two_factor_secret) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled for this account",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token,
      window: 1, // allows 30 seconds of clock drift either side
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP code",
      });
    }

    // OTP is valid — now issue the JWT cookie, same as standard login
    if (rememberDevice) {
      const newDeviceToken = crypto.randomBytes(32).toString("hex");
      const existing = (user.trusted_devices || []).filter(
        (d) => new Date(d.expires) > new Date(),
      );
      const updatedDevices = [
        ...existing,
        {
          token: newDeviceToken,
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          deviceInfo: req.headers["user-agent"] || "unknown",
        },
      ];
      await updateUserTrustedDevices(user.id, updatedDevices);
      setTrustedDeviceCookie(res, newDeviceToken);
    }

    await updateUserLastLogin(user.id);
    const jwtToken = signJwt(user);
    setAuthCookie(res, jwtToken);

    return res.status(200).json({
      success: true,
      message: "2FA verified successfully",
      username: user.username,
      isMfaActive: user.is_mfa_active,
    });
  } catch (error) {
    console.error("VERIFY 2FA ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying 2FA",
    });
  }
};

// ─── Reset 2FA ────────────────────────────────────────────────────────────────
export const reset2FA = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Pass null for the secret and false for is_mfa_active
    await updateUser2FA(user.id, null, false);

    return res.status(200).json({
      success: true,
      message: "2FA has been disabled",
    });
  } catch (error) {
    console.error("RESET 2FA ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Error resetting 2FA",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    
    const genericResponse = {
      success: true,
      message: "If that email exists, a reset link has been sent",
    };

    const user = await findUserByEmail(email.trim().toLowerCase());
    if (!user) return res.status(200).json(genericResponse);

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expireDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await updateUserResetToken(user.id, hashedToken, expireDate);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "HomeHub — Password Reset",
      `<p>You requested a password reset.</p>
       <p>Click the link below — it expires in <strong>10 minutes</strong>.</p>
       <a href="${resetUrl}"
          style="display:inline-block;padding:10px 20px;background:#3B5BDB;
                 color:white;border-radius:6px;text-decoration:none;">
         Reset Password
       </a>
       <p>If you didn't request this, ignore this email.</p>`,
    );

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { token } = req.params;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // findUserByResetToken checks expiry in SQL — returns null if expired
    const user = await findUserByResetToken(hashedToken);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // updateUserPassword clears the reset token AND trusted devices in one query
    await updateUserPassword(user.id, hashedPassword);

    // Clear cookies — force them to log in fresh with new password
    res.clearCookie("token", cookieOptions);
    res.clearCookie("trustedDevice", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully — please log in",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Error resetting password",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Never send sensitive fields to the frontend
    const {
      password,
      two_factor_secret,
      reset_password_token,
      reset_password_expire,
      trusted_devices,
      ...safeUser
    } = user;

    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
  }
};
export const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {

      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_failed`
      );
    }

    await updateUserLastLogin(user.id);

    const token = signJwt(user);
    setAuthCookie(res, token);


    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);

  } catch (error) {
    console.error("GOOGLE CALLBACK ERROR:", error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=server_error`
    );
  }
};
const authController = {
  // register,
  login,
  logout,
  setup2FA,
  verify2FA,
  reset2FA,
  forgotPassword,
  resetPassword,
  googleCallback,
  getMe,
};

export default authController;
