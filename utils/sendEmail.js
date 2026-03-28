const nodemailer = require("nodemailer");

/**
 * 📧 MULTI-ROLE SECURE DISPATCHER
 * Dynamically selects between Owner and Customer SMTP credentials 
 * based on the user's role.
 */
const sendEmail = async (options) => {
  // 1. Role-Based Identity Selection
  const isOwner = options.role === 'owner';
  
  // Select credentials from .env
  const user = isOwner ? process.env.OWNER_EMAIL_USER : process.env.CUSTOMER_EMAIL_USER;
  const pass = isOwner ? process.env.OWNER_EMAIL_PASS : process.env.CUSTOMER_EMAIL_PASS;

  // 2. Configure the SMTP Transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL/TLS
    auth: { user, pass },
    connectionTimeout: 10000, // 10s timeout
  });

  // 3. Define the Dispatch Package
  const mailOptions = {
    from: `"Ride N Roar ${isOwner ? 'Partner' : 'Security'}" <${user}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // Professional HTML box
    // Text fallback: strips HTML tags for compatibility
    text: options.message.replace(/<[^>]*>?/gm, ''), 
  };

  // 4. Execution & Intelligence Logging
  try {
    // Check if variables for the specific role are missing
    if (!user || !pass) {
      throw new Error(`Missing credentials for role: ${options.role} in .env file.`);
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`
    -------------------------------------------
    📧 DISPATCH SUCCESS [Role: ${options.role.toUpperCase()}]
    📬 Sent From: ${user}
    📬 Recipient: ${options.email}
    🆔 Message ID: ${info.messageId}
    -------------------------------------------
    `);

    return info;
  } catch (err) {
    // Detailed error logging for development
    console.error(`
    🚨 NODEMAILER FAILURE [Role: ${options.role}]
    ❌ Reason: ${err.message}
    🛠️  Check: 
        1. Is the App Password for ${user} correct?
        2. Is 2FA enabled on the ${options.role} Gmail account?
        3. Did you update the .env keys correctly?
    `);

    // Throwing error back to the Controller
    throw new Error(`Email service failed to dispatch secure code to ${options.role}.`);
  }
};

module.exports = sendEmail;