import pool from '../config/db.js';

async function verifyOtp(req, res) {
  const { email, otp } = req.body;

  try {
    // 1. Find OTP
    const result = await pool.query(
      "SELECT * FROM otp WHERE email = $1 AND otp = $2",
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "No OTP found for this email" });
    }

    const otpRow = result.rows[0];

    // 2. Check if expired
    if (new Date() > new Date(otpRow.expires_at)) {
      await pool.query('DELETE FROM otp WHERE email = $1', [email]);
      return res.status(400).json({ message: "OTP has expired" });
    }

    // 3. Update user as verified
    await pool.query('UPDATE users SET is_verified = TRUE WHERE email = $1', [email]);

    // 4. Delete OTP after verification
    await pool.query('DELETE FROM otp WHERE email = $1', [email]);

    return res.status(200).json({ message: "OTP verified successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
}

export default verifyOtp;