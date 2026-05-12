import { Router } from "express";
import authController from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import passport from '../config/passportConfig.js';
const authRouter = Router();

//publiv Routes

authRouter.post("/register", authController.register);

authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password/:token", authController.resetPassword);
authRouter.post("/verify-email", authController.verifyEmail);

authRouter.post("/2fa/verify", authController.verify2FA);

authRouter.post("/2fa/setup", protect, authController.setup2FA);
authRouter.post("/2fa/reset", protect, authController.reset2FA);
authRouter.get("/me", protect, authController.getMe);


authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
  }),
  authController.googleCallback // only runs if passport succeeded
);
export default authRouter;
