import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function checkBlacklistMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, phone } = req.body;
    
    if (!name || !email || !phone) {
      return next();
    }
    
    const isBlacklisted = await storage.checkBlacklist(name, email, phone);
    
    if (isBlacklisted) {
      return res.status(403).json({ 
        message: "Unable to register. Please contact Christ's Loving Hands at 513-367-7746" 
      });
    }
    
    next();
  } catch (error) {
    console.error("Blacklist check error:", error);
    // Don't fail the request if blacklist check fails
    next();
  }
}
