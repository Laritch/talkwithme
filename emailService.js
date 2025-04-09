/**
 * Email Service for Enhanced Chat System
 *
 * Handles sending email notifications for various system events
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure email transport
// For production, you would use actual SMTP credentials
// For development, we can use a testing service like Ethereal or console log the emails
const createTransport = () => {
  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    // Use real SMTP service
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // For development, just log the emails
    return {
      sendMail: (mailOptions) => {
        console.log('==================== EMAIL SENT ====================');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Text:', mailOptions.text);
        if (mailOptions.html) {
          console.log('HTML:', mailOptions.html.substring(0, 100) + '...');
        }
        console.log('====================================================');

        // Return a resolved promise with an info object
        return Promise.resolve({ messageId: 'test-message-id' });
      }
    };
  }
};

// Initialize transport
const transporter = createTransport();

/**
 * Send a password reset email
 * @param {string} email - Recipient email
 * @param {string} resetCode - The reset verification code
 * @returns {Promise} - Resolves with info about the sent email
 */
export const sendPasswordResetEmail = async (email, resetCode) => {
  const mailOptions = {
    from: `"Enhanced Chat System" <${process.env.EMAIL_FROM || 'noreply@chat.com'}>`,
    to: email,
    subject: 'Password Reset Verification Code',
    text: `Your verification code to reset your password is: ${resetCode}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <h2 style="color: #667eea;">Enhanced Chat System</h2>
        <p>You've requested a password reset for your account.</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f5f7fb; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${resetCode}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this reset, please ignore this email or contact support if you're concerned about your account security.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #6c757d; font-size: 12px;">
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send a welcome email to new users
 * @param {string} email - Recipient email
 * @param {string} username - User's username
 * @returns {Promise} - Resolves with info about the sent email
 */
export const sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: `"Enhanced Chat System" <${process.env.EMAIL_FROM || 'noreply@chat.com'}>`,
    to: email,
    subject: 'Welcome to Enhanced Chat System',
    text: `Hello ${username},\n\nWelcome to Enhanced Chat System! We're excited to have you join our community.\n\nYou can now log in and start chatting with others, create groups, and enjoy all our features.\n\nBest regards,\nThe Enhanced Chat Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <h2 style="color: #667eea;">Welcome to Enhanced Chat!</h2>
        <p>Hello ${username},</p>
        <p>We're excited to have you join our community!</p>
        <p>You can now log in and start:</p>
        <ul>
          <li>Chatting with other users</li>
          <li>Creating and joining group conversations</li>
          <li>Sharing files and images</li>
          <li>Customizing your profile</li>
        </ul>
        <p><a href="${process.env.APP_URL || 'https://chat.same-app.com'}/login.html" style="background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Log In Now</a></p>
        <p>Need help getting started? Check out our <a href="${process.env.APP_URL || 'https://chat.same-app.com'}/help.html" style="color: #667eea; text-decoration: none;">help documentation</a>.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #6c757d; font-size: 12px;">
          <p>Best regards,<br>The Enhanced Chat Team</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send an admin notification email
 * @param {string} type - Type of notification
 * @param {Object} data - Data related to the notification
 * @param {Array<string>} adminEmails - List of admin email addresses
 * @returns {Promise} - Resolves with info about the sent email
 */
export const sendAdminNotification = async (type, data, adminEmails) => {
  // If no adminEmails provided, use the default admin email
  const recipients = adminEmails || [process.env.ADMIN_EMAIL || 'admin@chat.com'];

  let subject = '';
  let text = '';
  let html = '';

  switch(type) {
    case 'new_admin':
      subject = 'New Admin User Created';
      text = `A new admin user has been created.\n\nUsername: ${data.username}\nEmail: ${data.email}\n\nThis user now has full administrative privileges.`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h2 style="color: #667eea;">New Admin User Created</h2>
          <p>A new user with administrator privileges has been created:</p>
          <div style="background-color: #f5f7fb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Username:</strong> ${data.username}</p>
            <p><strong>Email:</strong> ${data.email}</p>
          </div>
          <p>This user now has full administrative privileges including user management and content moderation.</p>
          <p><a href="${process.env.APP_URL || 'https://chat.same-app.com'}/login.html" style="background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Log In to Admin Panel</a></p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #6c757d; font-size: 12px;">
            <p>This is an automated security notification.</p>
          </div>
        </div>
      `;
      break;

    case 'user_deleted':
      subject = 'User Account Deleted';
      text = `A user account has been deleted from the system.\n\nUsername: ${data.username}\nEmail: ${data.email}\n\nAll associated data has been removed.`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h2 style="color: #667eea;">User Account Deleted</h2>
          <p>A user account has been deleted from the system:</p>
          <div style="background-color: #f5f7fb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Username:</strong> ${data.username}</p>
            <p><strong>Email:</strong> ${data.email}</p>
          </div>
          <p>All associated data with this account has been removed from the system.</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #6c757d; font-size: 12px;">
            <p>This is an automated administrative notification.</p>
          </div>
        </div>
      `;
      break;

    case 'content_moderated':
      subject = 'Content Moderation Action';
      text = `A content moderation action has been taken.\n\nAction: ${data.action}\nContent Type: ${data.contentType}\nUser: ${data.username}\n\nThis is an automated notification.`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h2 style="color: #667eea;">Content Moderation Action</h2>
          <p>A content moderation action has been taken:</p>
          <div style="background-color: #f5f7fb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Action:</strong> ${data.action}</p>
            <p><strong>Content Type:</strong> ${data.contentType}</p>
            <p><strong>User:</strong> ${data.username}</p>
          </div>
          <p><a href="${process.env.APP_URL || 'https://chat.same-app.com'}/login.html" style="background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Review in Admin Panel</a></p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #6c757d; font-size: 12px;">
            <p>This is an automated moderation notification.</p>
          </div>
        </div>
      `;
      break;

    case 'security_alert':
      subject = 'Security Alert - Enhanced Chat System';
      text = `A security alert has been triggered.\n\nType: ${data.alertType}\nDetails: ${data.details}\n\nPlease review this activity as soon as possible.`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h2 style="color: #dc3545;">Security Alert</h2>
          <p>A security alert has been triggered in the Enhanced Chat System:</p>
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
            <p><strong>Alert Type:</strong> ${data.alertType}</p>
            <p><strong>Details:</strong> ${data.details}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p><strong>Please review this activity as soon as possible.</strong></p>
          <p><a href="${process.env.APP_URL || 'https://chat.same-app.com'}/login.html" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Check Admin Dashboard</a></p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #6c757d; font-size: 12px;">
            <p>This is an urgent security notification.</p>
          </div>
        </div>
      `;
      break;

    case 'system_status':
      subject = 'System Status Update';
      text = `System Status Update\n\nStatus: ${data.status}\nDetails: ${data.details}\n\nThis is an automated system notification.`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h2 style="color: #667eea;">System Status Update</h2>
          <p>The Enhanced Chat System status has been updated:</p>
          <div style="background-color: ${data.status === 'operational' ? '#d4edda' : (data.status === 'degraded' ? '#fff3cd' : '#f8d7da')}; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Status:</strong> ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</p>
            <p><strong>Details:</strong> ${data.details}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p><a href="${process.env.APP_URL || 'https://chat.same-app.com'}/login.html" style="background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Check System Dashboard</a></p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #6c757d; font-size: 12px;">
            <p>This is an automated system notification.</p>
          </div>
        </div>
      `;
      break;

    default:
      subject = 'Enhanced Chat System Notification';
      text = `A notification has been generated from the Enhanced Chat System.\n\nType: ${type}\n\nPlease check the admin dashboard for more information.`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h2 style="color: #667eea;">System Notification</h2>
          <p>A notification has been generated from the Enhanced Chat System:</p>
          <div style="background-color: #f5f7fb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Please check the admin dashboard for more information.</p>
          <p><a href="${process.env.APP_URL || 'https://chat.same-app.com'}/login.html" style="background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Go to Admin Dashboard</a></p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #6c757d; font-size: 12px;">
            <p>This is an automated notification.</p>
          </div>
        </div>
      `;
  }

  const mailOptions = {
    from: `"Enhanced Chat System" <${process.env.EMAIL_FROM || 'noreply@chat.com'}>`,
    to: recipients.join(','),
    subject,
    text,
    html
  };

  return transporter.sendMail(mailOptions);
};

// Add a function to send order confirmation emails
export const sendOrderConfirmationEmail = async (orderDetails) => {
  const { customerEmail, orderId, orderSummary } = orderDetails;
  const subject = `Order Confirmation - Order #${orderId}`;
  const body = `Thank you for your purchase! Here are your order details:\n${orderSummary}`;
  const mailOptions = {
    from: `"Enhanced Chat System" <${process.env.EMAIL_FROM || 'noreply@chat.com'}>`,
    to: customerEmail,
    subject,
    text: body,
  };
  return transporter.sendMail(mailOptions);
};

// Add a function to send shipping update emails
export const sendShippingUpdateEmail = async (shippingDetails) => {
  const { customerEmail, trackingNumber, estimatedDelivery } = shippingDetails;
  const subject = `Shipping Update - Tracking #${trackingNumber}`;
  const body = `Your order has been shipped! Estimated delivery: ${estimatedDelivery}.\nTrack your package here: [tracking link]`;
  const mailOptions = {
    from: `"Enhanced Chat System" <${process.env.EMAIL_FROM || 'noreply@chat.com'}>`,
    to: customerEmail,
    subject,
    text: body,
  };
  return transporter.sendMail(mailOptions);
};

export default {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAdminNotification,
  sendOrderConfirmationEmail,
  sendShippingUpdateEmail
};
