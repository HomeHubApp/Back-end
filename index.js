import dotenv from "dotenv";
dotenv.config();

import express, { json, urlencoded } from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import authRouter from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import './config/passportConfig.js';
import deviceRouter from "./routes/deviceRoutes.js";

const app =  express();


//middlewares
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const corseOptions = {
    origin: frontendUrl,
    credentials: true,
};
app.use(cors(corseOptions));
app.use(json({limit: "1mb"}));
app.use(urlencoded({limit: "1mb", extended: true}));
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true
    }
}));
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use("/api/auth", authRouter);
app.use("/api/devices", deviceRouter);
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
    });
});

const port = process.env.PORT || 5000;
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});
