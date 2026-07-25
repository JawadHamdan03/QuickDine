import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { AuthRequest } from "../middlewares/auth.js";

const generateJwtToken = async (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
};

// api/auth/[action]

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, phone, role } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ message: "Name, email, and password are required" });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            res.status(400).json({ message: "User already exists with this email" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone?.trim(),
            role: role || "user",
        });

        const token = await generateJwtToken(newUser._id.toString(), newUser.role);

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: newUser.toJSON(),
        });
    } catch (error) {
        res.status(500).json({ message: "Registration failed", error: error instanceof Error ? error.message : error });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select("+password");

        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password || "");
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        const token = await generateJwtToken(user._id.toString(), user.role);

        res.status(200).json({
            message: "Login successful",
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error: error instanceof Error ? error.message : error });
    }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }

        res.status(200).json({ user: req.user });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch current user", error: error instanceof Error ? error.message : error });
    }
};

