import dotenv from "dotenv";
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

// 1. TRUST PROXY: Vital for Render to handle HTTPS cookies
app.set("trust proxy", 1);

// 2. MIDDLEWARES
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({
    origin: frontendUrl,
    credentials: true,
}));

app.use(json({ limit: "1mb" }));
app.use(urlencoded({ limit: "1mb", extended: true }));
app.use(cookieParser());

// 3. SESSION & COOKIE SETTINGS
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, 
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        // If on Render (Production), use Secure and SameSite: None
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// 4. ROUTES
app.use("/api/auth", authRouter);
app.use("/api/devices", deviceRouter);

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        mode: process.env.NODE_ENV || 'development'
    });
});

// 5. SERVER START
const port = process.env.PORT || 7001;
app.listen(port, () => {
    console.log(`Server is running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
});