import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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

export const sendVerificationEmail = async (email: string, verificationToken: string) => {
  const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"Brownie Shop" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Welcome to Brownie Shop!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"Brownie Shop" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendOrderConfirmationEmail = async (email: string, orderDetails: any) => {
  const mailOptions = {
    from: `"Brownie Shop" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Order Confirmation - Brownie Shop',
    html: `
      <h1>Thank you for your order!</h1>
      <p>Your order has been successfully placed and paid.</p>
      
      <h2>Order Details:</h2>
      <ul>
        ${orderDetails.items.map((item: any) => `
          <li>${item.name} (${item.variantName}) - ${item.quantity}x - ₱${item.price}</li>
        `).join('')}
      </ul>
      
      <p><strong>Total Amount:</strong> ₱${orderDetails.totalAmount.toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
      
      <p>You can track your order status here:</p>
      <a href="http://localhost:5173/track-order/${orderDetails._id}">Track Order</a>
    `
  };

  await transporter.sendMail(mailOptions);
};
