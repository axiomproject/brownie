import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { OAuth2Client } from 'google-auth-library';
import { emitNotification } from '../services/socketService';
import { Notification } from '../models/Notification';

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody extends LoginBody {
  name: string;
  address?: string;
  phone?: string;
}

interface AuthResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

type AsyncRequestHandler = RequestHandler<
  any,
  any,
  any,
  any,
  Record<string, any>
>;

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const registerHandler: AsyncRequestHandler = async (req, res) => {
  try {
    const { email, password, name } = req.body as RegisterBody;

    if (!email || !password || !name) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user with verification data
    const user = new User({
      ...req.body,
      verificationToken,
      verificationExpires,
      isVerified: false
    });
    
    await user.save();
    
    // Create and emit notification
    const notification = await Notification.create({
      type: 'NEW_USER',
      message: `New user registered: ${user.name}`,
      data: {
        userId: user._id,
        userEmail: user.email
      }
    });

    emitNotification({
      type: 'NEW_USER',
      message: `New user registered: ${user.name}`,
      timestamp: new Date(),
      data: {
        userId: user._id,
        userEmail: user.email
      }
    });

    try {
      await sendVerificationEmail(user.email, verificationToken);
      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.'
      });
    } catch (emailError) {
      // If email fails, delete the user and report error
      await User.findByIdAndDelete(user._id);
      throw new Error('Failed to send verification email');
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

const verifyEmailHandler: AsyncRequestHandler = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('Received verification token:', token);

    // First, try to find any user with this token
    const user = await User.findOne({ verificationToken: token });
    console.log('Found user:', user);

    if (!user) {
      res.status(400).json({ message: 'Invalid verification token' });
      return;
    }

    // If user is already verified
    if (user.isVerified) {
      res.status(400).json({ message: 'Email is already verified. Please login.' });
      return;
    }

    // Check if token is expired
    if (user.verificationExpires && user.verificationExpires < new Date()) {
      res.status(400).json({ message: 'Verification token has expired' });
      return;
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const resendVerificationHandler: AsyncRequestHandler = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email, isVerified: false });
    
    if (!user) {
      res.status(400).json({ 
        message: 'Invalid email or already verified' 
      });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();

    await sendVerificationEmail(email, verificationToken);
    
    res.json({ 
      message: 'Verification email resent successfully' 
    });
    return;
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification email' });
    return;
  }
};

const loginHandler: AsyncRequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Only check verification for non-admin users
    if (!user.isVerified && user.role !== 'admin') {
      res.status(403).json({ message: 'Please verify your email before logging in' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { 
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    return;
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};

const forgotPasswordHandler: AsyncRequestHandler = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return success even if user not found (security)
      res.json({ message: 'If your email is registered, you will receive a password reset link.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    await sendPasswordResetEmail(email, resetToken);
    res.json({ message: 'If your email is registered, you will receive a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
};

const resetPasswordHandler: AsyncRequestHandler = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

const googleAuthHandler: AsyncRequestHandler = async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token');
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Create new user if doesn't exist
      user = new User({
        email,
        name,
        googleId,
        picture,
        password: crypto.randomBytes(16).toString('hex'), // Random password for Google users
        isVerified: true // Google users are automatically verified
      });
      await user.save();

      // Create and emit notification for new Google user
      const notification = await Notification.create({
        type: 'NEW_USER',
        message: `New user registered via Google: ${user.name}`,
        data: {
          userId: user._id,
          userEmail: user.email,
          source: 'google'
        }
      });

      emitNotification({
        type: 'NEW_USER',
        message: `New user registered via Google: ${user.name}`,
        timestamp: new Date(),
        data: {
          userId: user._id,
          userEmail: user.email,
          source: 'google'
        }
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.picture = picture;
      await user.save();
    }

    const jwtToken = jwt.sign(
      { 
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

// Add new endpoint to fetch notifications
const getNotificationsHandler: AsyncRequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

const markNotificationAsReadHandler: AsyncRequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

const clearAllNotificationsHandler: AsyncRequestHandler = async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
};

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.get('/verify-email/:token', verifyEmailHandler);
router.post('/resend-verification', resendVerificationHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);
router.post('/google', googleAuthHandler);
router.get('/notifications', getNotificationsHandler);
router.patch('/notifications/:id/read', markNotificationAsReadHandler);
router.delete('/notifications', clearAllNotificationsHandler);

export default router;
