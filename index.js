import express, { json, urlencoded } from "express";
import session from "express-session";
import { Passport } from "passport";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import dbConnect from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import "./config/passportConfig.js"
import cookieParser from "cookie-parser";

dotenv.config();// fetches environment variables from .env file
dbConnect(); 
const app =  express();


//middlewares
const corseOptions = {
    origin: "http://localhost:3000",
    Credentials: true,
};
app.use(cors(corseOptions));
app.use(json({limit: "100mb"}));
app.use(urlencoded({limit: "100mb", extended: true}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

//routes
app.use("/api/auth", authRouter);

const port = process.env.PORT || 5000;
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});