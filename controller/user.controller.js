import User from "../model/User.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import {  z } from "zod";
import jwt from 'jsonwebtoken'


// 1. Define validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string()
           .trim()
           .toLowerCase()
           .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});


//Register User

const registerUser = async (req, res) => {
  try {
    // 2. Validate input with Zod
    const { name, email, password } = registerSchema.parse(req.body);

    // 3. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 4. Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create user
    const user = await User.create({
      name,
      email,
      password,      //hook will hash
    });

    // 6. Create verification token
    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token; 
    await user.save();

    // 7. Configure Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    // 8. Email options
    const mailOptions = {
      from: `"Authentication" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Verify your email",
      text: `Please verify your email by clicking on the link:
${process.env.BASE_URL}/api/v1/users/verify/${token}`,
      html: `<p>Please verify your email by clicking 
      <a href="${process.env.BASE_URL}/api/v1/users/verify/${token}">here</a></p>`,
    };

    // 9. Send email
    await transporter.sendMail(mailOptions);

    // 10. Response
    res.status(201).json({
      message: "User registered successfully. Please check your email to verify.",
      success: true,
    });
  } catch (error) {
    // Zod error handling
    if (error.errors) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors.map((err) => err.message),
        success: false,
      });
    }

    res.status(500).json({
      message: "Failed to register user",
      error: error.message,
      success: false,
    });
  }
};



//Verify User

const verifyUser = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Invalid token",
        success: false,
      });
    }

    // find user by token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
        success: false,
      });
    }

    // update user status
    user.isVerified = true; 
    user.verificationToken = undefined;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify user",
      error: error.message,
      success: false,
    });
  }
};







// Login Schema
const loginSchema = z.object({
  email: z.string().trim().toLowerCase()
           .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
        success: false,
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        success: false,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
        success: false,
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "24h" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "User logged in successfully",
      token,
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors.map((err) => err.message),
        success: false,
      });
    }

    res.status(500).json({
      message: "Login failed",
      error: error.message,
      success: false,
    });
  }
};









export { registerUser, verifyUser ,login};



