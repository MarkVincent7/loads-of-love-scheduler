import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../lib/auth";

export interface AuthRequest extends Request {
  adminId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }
    
    const adminId = verifyAuthToken(token);
    if (!adminId) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    req.adminId = adminId;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
}
