import express from "express";
import sendotp from "../controller/otpcontroller.js";
import verifyOtp from "../controller/verifyotp.js";
import  createUserController  from "../controller/usercontroller.js";

const router = express.Router();

router.post("/signup", createUserController);            
router.post("/signup/sendotp", sendotp);                
router.post("/signup/verifyotp", verifyOtp);            


export default router;