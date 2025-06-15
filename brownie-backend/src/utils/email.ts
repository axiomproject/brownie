import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import type { Error } from 'mongoose';
import { type IOrder, type IOrderPopulated } from '../models/Order'; // Change this line

// Ensure environment variables are loaded
dotenv.config();

// Add this debug line to verify environment variables
console.log('Email Config:', {
  user: process.env.GMAIL_USER,
  pass: process.env.GMAIL_APP_PASSWORD?.substring(0, 4) + '****' // Log first 4 chars only for security
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '') // Remove any spaces
  },
  debug: true // Enable debug logs
});

// Modify the verify function to handle errors better
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } else {
    console.log('SMTP server is ready');
  }
});

interface EmailCallback {
  (error: Error | null, success?: any): void;
}

// Add this shared email style template
const emailStyles = `
  <style>
    .email-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      color: #334155;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      color: #1e293b;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .content {
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      background-color: #7c3aed;
      color: #ffffff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #6d28d9;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 14px;
      color: #64748b;
    }
    .order-details {
      background-color: #f8fafc;
      padding: 16px;
      border-radius: 6px;
      margin: 16px 0;
    }
    .order-items {
      list-style: none;
      padding: 0;
      margin: 12px 0;
    }
    .order-items li {
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .order-items li:last-child {
      border-bottom: none;
    }
  </style>
`;

// Update the sendEmail function to include the styles
async function sendEmail(to: string, subject: string, content: string, callback?: EmailCallback) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${emailStyles}
      </head>
      <body>
        <div class="email-container">
          ${content}
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'Shop'}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (callback) callback(null, info);
    return info;
  } catch (error) {
    if (callback) callback(error as Error);
    throw error;
  }
}

interface OrderItem {
  name: string;
  variantName: string;
  quantity: number;
}

export async function sendOrderConfirmationEmail(email: string, order: IOrder | IOrderPopulated): Promise<void> {
  const content = `
    <div class="header">
      <h1>Thank you for your order!</h1>
    </div>
    <div class="content">
      <p>Your order #${order._id.toString().slice(-6)} has been received and is being processed.</p>
      <div class="order-details">
        <h2>Order Details</h2>
        <ul class="order-items">
          ${order.items.map((item: OrderItem) => `
            <li>${item.name} (${item.variantName}) × ${item.quantity}</li>
          `).join('')}
        </ul>
        <p><strong>Total Amount:</strong> ₱${order.totalAmount}</p>
      </div>
    </div>
  `;

  await sendEmail(email, 'Order Confirmation', content);
}

export async function sendDeliveryConfirmationEmail(email: string, order: IOrder | IOrderPopulated): Promise<void> {
  const feedbackUrl = `${process.env.FRONTEND_URL}/feedback/${order._id.toString()}`;
  const content = `
    <div class="header">
      <h1>Your Order Has Been Delivered!</h1>
    </div>
    <div class="content">
      <p>Dear Customer,</p>
      <p>We're happy to confirm that your order #${order._id.toString().slice(-6)} has been delivered.</p>
      
      <div class="order-details">
        <h2>Order Details</h2>
        <ul class="order-items">
          ${order.items.map((item: OrderItem) => `
            <li>${item.name} (${item.variantName}) × ${item.quantity}</li>
          `).join('')}
        </ul>
      </div>
      
      <p>We hope you enjoy your brownies! Your feedback is important to us.</p>
      <div style="text-align: center;">
        <a href="${feedbackUrl}" class="button">Leave Feedback</a>
      </div>
    </div>
  `;

  await sendEmail(email, 'Order Delivered - We Value Your Feedback!', content);
}

export async function sendOrderRefundEmail(email: string, order: IOrder | IOrderPopulated): Promise<void> {
  const content = `
    <div class="header">
      <h1>Refund Confirmation</h1>
    </div>
    <div class="content">
      <div class="order-details">
        <p><strong>Order:</strong> #${order._id.toString().slice(-6)}</p>
        <p><strong>Amount:</strong> ₱${order.totalAmount}</p>
      </div>
      <p>Your refund has been processed and will be returned to your original payment method.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  `;

  await sendEmail(email, 'Refund Confirmation', content);
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const content = `
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>You requested to reset your password. Click the button below to set a new password:</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #64748b;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail(email, 'Password Reset Request', content);
}

export async function sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const content = `
    <div class="header">
      <h1>Welcome to ${process.env.APP_NAME || 'our shop'}!</h1>
    </div>
    <div class="content">
      <p>Please verify your email address to complete your registration:</p>
      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email</a>
      </div>
      <p style="font-size: 14px; color: #64748b;">If you didn't create an account, please ignore this email.</p>
    </div>
  `;

  await sendEmail(email, 'Verify Your Email', content);
}
