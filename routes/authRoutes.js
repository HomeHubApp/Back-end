import { Router } from "express";
import passport, { Passport } from "passport";
import authController from "../controllers/authController.js";
import { protect } from "../config/passportConfig.js";

const authRouter = Router();

//registration
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
//status
authRouter.post("/status", protect, authController.status);
//logout
authRouter.post("/logout", authController.logout);

//forgot password
authRouter.post("/forgot-password", authController.forgotPassword);
//reset  password
authRouter.post("/reset-password/:token", authController.resetPassword);
//2FA setup
authRouter.post("/2fa/setup", protect, authController.setup2FA);
//verifyToken
authRouter.post("/verify", protect, authController.verify2FA);
//Reset
authRouter.post("/2fa/reset", protect, authController.reset2FA);

export default authRouter;
