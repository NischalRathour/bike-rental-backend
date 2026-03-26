const nodemailer = require("nodemailer");

/**
 * 📧 SECURE EMAIL DISPATCHER (Nodemailer Implementation)
 */
const sendEmail = async (options) => {
  // 1. Configure the SMTP Transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password if Gmail 2FA is active
    },
  });

  // 2. Define Dispatch Logic
  const mailOptions = {
    from: `"Ride N Roar Hub" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
    text: options.message.replace(/<[^>]*>?/gm, ''), // Clean text fallback
  };

  // 3. Execution
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Encryption Dispatch: [Success] ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("❌ DISPATCH FAILURE:", err.message);
    if (process.env.NODE_ENV === 'development') {
       console.log("Check EMAIL_USER and EMAIL_PASS keys in your environment variables.");
    }
    throw new Error("System could not dispatch secure email.");
  }
};

module.exports = sendEmail;