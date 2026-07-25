import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IUser, User } from "../models/User.js";

export interface AuthRequest extends Request {
    user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "No token provided" });
            return;
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token", error: error instanceof Error ? error.message : error });
    }
};

export const authorizeRoles = (...roles: Array<"user" | "admin" | "owner">) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: `Access denied. Required roles: ${roles.join(", ")}` });
            return;
        }

        next();
    };
};

export const adminOnly = authorizeRoles("admin");
export const ownerOnly = authorizeRoles("owner");
export const userOrOwner = authorizeRoles("user", "owner");

export default protect;

