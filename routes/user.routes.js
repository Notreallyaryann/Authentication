import express from 'express';
import { 
  registerUser,
  verifyUser,
  login,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword
} from '../controller/user.controller.js';
import { isLoggedIn } from '../middleware/auth.middleware.js';

const router = express.Router();

// Auth routes
router.post('/register', registerUser);
router.get('/verify/:token', verifyUser);
router.post('/login', login);

// Protected routes
router.get('/me', isLoggedIn, getMe);
router.post('/logout', isLoggedIn, logoutUser);

// Password reset routes
router.post('/forgot', forgotPassword);        // request password reset
router.post('/reset/:token', resetPassword);   // reset using token

export default router;
