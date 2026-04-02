import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: 'verlie.marquardt66@ethereal.email',
    pass: 'Hr5wQDhrnAxwaUf8As'
  },
});

// Function to send email
async function sendEmail(otp, email) {
  try {
    const info = await transporter.sendMail({
      from: '"Upnepa App" <verlie.marquardt66@ethereal.email>', // must match your Ethereal user
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP is ${otp}</b>`,
    });

    console.log("Message sent:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    return info; 
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send OTP"); // throw, let controller handle response
  }
}

export default sendEmail;
