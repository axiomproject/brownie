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

async function sendEmail(to: string, subject: string, html: string, callback?: EmailCallback) {
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
  const subject = 'Order Confirmation';
  const html = `
    <h1>Thank you for your order!</h1>
    <p>Your order #${order._id} has been received and is being processed.</p>
    <h2>Order Details:</h2>
    <ul>
      ${order.items.map((item: OrderItem) => `
        <li>${item.name} (${item.variantName}) - Quantity: ${item.quantity}</li>
      `).join('')}
    </ul>
    <p>Total Amount: ₱${order.totalAmount}</p>
  `;

  await sendEmail(email, subject, html);
}

export async function sendDeliveryConfirmationEmail(email: string, order: IOrder | IOrderPopulated): Promise<void> {
  const subject = 'Order Delivered';
  const html = `
    <h1>Your order has been delivered!</h1>
    <p>Order #${order._id} has been successfully delivered.</p>
    <p>Thank you for choosing our service!</p>
  `;

  await sendEmail(email, subject, html);
}

export async function sendOrderRefundEmail(email: string, order: IOrder | IOrderPopulated): Promise<void> {
  const subject = 'Order Refund Confirmation';
  const html = `
    <h1>Refund Confirmation</h1>
    <p>Your refund for order #${order._id} has been processed.</p>
    <p>Amount: ₱${order.totalAmount}</p>
    <p>The refund will be processed according to your original payment method.</p>
    <p>If you have any questions, please contact our support team.</p>
  `;

  await sendEmail(email, subject, html);
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  const html = `
    <h1>Password Reset Request</h1>
    <p>You requested to reset your password. Click the link below to reset it:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  await sendEmail(email, subject, html);
}

export async function sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const subject = 'Verify Your Email';
  const html = `
    <h1>Welcome!</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationLink}">Verify Email</a>
    <p>If you didn't create an account, please ignore this email.</p>
  `;

  await sendEmail(email, subject, html);
}
