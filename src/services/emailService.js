const nodemailer = require('nodemailer');
const config = require('../config/env');


let sgMail = null;
if (config.NODE_ENV === 'production') {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.SENDGRID_API_KEY);
    console.log(' SendGrid initialized for production');
  } catch (error) {
    console.warn(' SendGrid not available, falling back to Nodemailer');
    sgMail = null;
  }
}

class EmailService {
  constructor() {
    this.provider = 'nodemailer';
    
    if (config.NODE_ENV === 'production' && config.SENDGRID_API_KEY && sgMail) {
      this.provider = 'sendgrid';
      console.log(' Using SendGrid for email');
    } else {
      console.log('Using Nodemailer for email');
    }
    
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(config.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    const from = config.EMAIL_FROM || 'noreply@bogcloud.com';
    
    if (this.provider === 'sendgrid' && sgMail) {
      try {
        const msg = {
          to,
          from,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, '')
        };
        return await sgMail.send(msg);
      } catch (error) {
        console.warn('⚠️ SendGrid failed, falling back to Nodemailer:', error.message);
      }
    }
    
    const mailOptions = {
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };
    
    if (!config.SMTP_USER || !config.SMTP_PASS) {
      console.warn('⚠️ No SMTP credentials found. Email will be simulated.');
      console.log(`📧 [SIMULATED] Email to ${to}: ${subject}`);
      return { success: true, simulated: true };
    }
    
    return await this.transporter.sendMail(mailOptions);
  }

  async sendVerificationEmail(email, name, token) {
    const verificationUrl = `${config.APP_URL || 'http://localhost:5001'}/api/v1/email/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BOG Cloud</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with BOG Cloud. Please click the button below to verify your email address.</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with BOG Cloud, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 BOG Cloud. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      BOG Cloud - Verify Your Email Address
      Hello ${name},
      Thank you for registering with BOG Cloud. Please click the link below to verify your email address.
      ${verificationUrl}
      This link will expire in 24 hours.
      If you didn't create an account with BOG Cloud, please ignore this email.
    `;

    return await this.sendEmail(email, 'Verify Your Email Address - BOG Cloud', html, text);
  }

  async sendWelcomeEmail(email, name) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .features { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
          .feature { flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to BOG Cloud</h1>
        </div>
        <div class="content">
          <h2>Welcome ${name}!</h2>
          <p>You're now part of BOG Cloud. Here's what you can do:</p>
          <div class="features">
            <div class="feature">
              <h3>🔐 Password Manager</h3>
              <p>Store and manage all your passwords securely</p>
            </div>
            <div class="feature">
              <h3>☁️ Cloud Storage</h3>
              <p>Upload and access your files from anywhere</p>
            </div>
            <div class="feature">
              <h3>📱 Cross-Device Sync</h3>
              <p>Access your data on any device</p>
            </div>
          </div>
          <p>Get started by saving your first password or uploading a file!</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 BOG Cloud. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, 'Welcome to BOG Cloud!', html);
  }

  async sendPasswordResetEmail(email, name, token) {
    const resetUrl = `${config.APP_URL || 'http://localhost:5001'}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BOG Cloud</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 BOG Cloud. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, 'Reset Your Password - BOG Cloud', html);
  }

  async sendOTPEmail(to, otp, purpose) {
    try {
      const subject = purpose === 'password_reset' 
        ? "Reset Your Password - BOG Cloud" 
        : "Verify Your Email - BOG Cloud";
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; text-align: center; }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #4F46E5;
      letter-spacing: 10px;
      padding: 15px 30px;
      background: white;
      border-radius: 8px;
      display: inline-block;
      margin: 20px 0;
    }
    .footer { font-size: 12px; color: #6c757d; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>BOG Cloud</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You requested to ${purpose === 'password_reset' ? 'reset your password' : 'verify your email'}.</p>
      <p>Use the OTP code below:</p>
      <div class="otp-code">${otp}</div>
      <p>This OTP will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 BOG Cloud. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      const text = `
        BOG Cloud - ${subject}
        
        Hello,
        
        You requested to ${purpose === 'password_reset' ? 'reset your password' : 'verify your email'}.
        
        Your OTP code is: ${otp}
        
        This OTP will expire in 10 minutes.
        
        If you didn't request this, please ignore this email.
        
        © 2026 BOG Cloud. All rights reserved.
      `;

      const mailOptions = {
        from: `BOG Cloud <${config.EMAIL_USER || process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html,
        text: text
      };

      await this.transporter.sendMail(mailOptions);
      console.log(` OTP email sent to ${to}`);
      return { success: true };
      
    } catch (error) {
      console.error(" Email error:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Admin Invitation Email
  async sendAdminInvitationEmail(to, name, adminName, token) {
    try {
      const acceptUrl = `${process.env.APP_URL || 'http://localhost:5001'}/api/v1/admin/invitations/${token}/accept`;
      const rejectUrl = `${process.env.APP_URL || 'http://localhost:5001'}/api/v1/admin/invitations/${token}/reject`;

      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px; }
    .btn-accept { background: #4f46e5; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .footer { font-size: 12px; color: #6c757d; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>BOG Cloud</h2>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p><strong>${adminName}</strong> has invited you to become an admin for BOG Cloud.</p>
      <p>As an admin, you can:</p>
      <ul>
        <li>Manage all users</li>
        <li>View platform analytics</li>
        <li>Suspend/delete users</li>
        <li>Assign/remove admin roles</li>
      </ul>
      <p style="text-align: center;">
        <a href="${acceptUrl}" class="button btn-accept">Accept Invitation</a>
        <a href="${rejectUrl}" class="button btn-reject">Reject</a>
      </p>
      <p>This invitation expires in <strong>72 hours</strong>.</p>
      <p>If you have any questions, contact your administrator.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 BOG Cloud. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `BOG Cloud <${config.EMAIL_USER || process.env.EMAIL_USER}>`,
        to: to,
        subject: "You've Been Invited to Become an Admin - BOG Cloud",
        html: html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(` Admin invitation email sent to ${to}`);
      return { success: true };

    } catch (error) {
      console.error(" Email error:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Admin Welcome Email
  async sendAdminWelcomeEmail(to, name) {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .footer { font-size: 12px; color: #6c757d; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Welcome to BOG Cloud Admin</h2>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>Congratulations! You are now an admin on BOG Cloud.</p>
      <p>You now have access to the admin dashboard where you can:</p>
      <ul>
        <li>View and manage all users</li>
        <li>Monitor platform analytics</li>
        <li>Assign admin privileges</li>
        <li>Suspend or delete users</li>
      </ul>
      <p>Login to your dashboard to get started.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 BOG Cloud. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `BOG Cloud <${config.EMAIL_USER || process.env.EMAIL_USER}>`,
        to: to, 
        subject: "Welcome to BOG Cloud Admin Dashboard!",
        html: html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(` Admin welcome email sent to ${to}`);
      return { success: true };

    } catch (error) {
      console.error(" Email error:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Password Reset Email (Admin triggered)
  async sendPasswordResetEmailAdmin(to, name, newPassword) {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .password-box {
      font-size: 24px;
      font-weight: bold;
      color: #4f46e5;
      padding: 15px 30px;
      background: white;
      border-radius: 8px;
      display: inline-block;
      margin: 20px 0;
    }
    .footer { font-size: 12px; color: #6c757d; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>BOG Cloud</h2>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>Your password has been reset by an administrator.</p>
      <p>Your new password is:</p>
      <div class="password-box">${newPassword}</div>
      <p>Please login and change your password immediately.</p>
      <p><a href="${process.env.APP_URL || 'http://localhost:5001'}/login">Login Now</a></p>
    </div>
    <div class="footer">
      <p>&copy; 2026 BOG Cloud. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `BOG Cloud <${config.EMAIL_USER || process.env.EMAIL_USER}>`,
        to: to,
        subject: "Your Password Has Been Reset - BOG Cloud",
        html: html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(` Password reset email sent to ${to}`);
      return { success: true };

    } catch (error) {
      console.error(" Email error:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();