import dotenv from "dotenv";
// Only load .env file if not in production
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

import express, { json, urlencoded } from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";
import deviceRouter from "./routes/deviceRoutes.js";
import './config/passportConfig.js';

const app = express();

/**
 * 1. PROXY TRUST
 * Required for Render. This ensures that 'req.protocol' is 'https' 
 * and that cookies with 'secure: true' are actually sent.
 */
app.set("trust proxy", 1);

/**
 * 2. CORS CONFIGURATION
 * Must allow the specific frontend URL and credentials for httpOnly cookies.
 */
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const corsOptions = {
    origin: frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));

/**
 * 3. STANDARD MIDDLEWARES
 */
app.use(json({ limit: "1mb" }));
app.use(urlencoded({ limit: "1mb", extended: true }));
app.use(cookieParser());

/**
 * 4. SESSION & COOKIE CONFIGURATION
 * Optimized for Render's HTTPS environment.
 */
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Specifically tells session to trust the reverse proxy
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,                 // Prevents XSS
        // 'secure' must be true in production (requires HTTPS)
        secure: process.env.NODE_ENV === "production", 
        // 'none' is required if frontend and backend are on different domains
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));

/**
 * 5. PASSPORT INITIALIZATION
 */
app.use(passport.initialize());
app.use(passport.session());

/**
 * 6. ROUTES
 */
app.use("/api/auth", authRouter);
app.use("/api/devices", deviceRouter);

// Health Check for Render deployment monitoring
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        env: process.env.NODE_ENV
    });
});

/**
 * 7. SERVER START
 */
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});