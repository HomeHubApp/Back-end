
import Generateotp from '../helpers/generateotp.js';
import otpmodel from '../model/otp.js';
import sendEmail from '../helpers/sendotp.js';
import pool from '../config/db.js';

async function sendotp(req,res) {
    const {email}=req.body
    try{
    const Generatenewotp=Generateotp()
    const expiresAT=new Date(Date.now()+5*60*1000)
 

await pool.query('INSERT INTO otp (email, otp, expires_at) VALUES ($1, $2, $3) RETURNING *', [email, Generatenewotp, expiresAT]);
   await sendEmail(Generatenewotp,email)
    res.status(200).json({message:`A 6 Digit has been sent to  ${email}` })
}
catch(error){
    console.error(error);
    res.status(500).json({message:"Failed to send OTP"})    
}

}
export default sendotp;