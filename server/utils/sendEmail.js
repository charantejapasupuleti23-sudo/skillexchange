const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // If SMTP is not fully configured, log to console in development
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    process.env.EMAIL_USER === ''
  ) {
    console.log('--- [Simulated Email Notification] ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: \n${options.message}`);
    console.log('---------------------------------------');
    return { simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || 'SkillLoop'} <${process.env.EMAIL_FROM || 'noreply@skillloop.dev'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
