import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAuthToken(adminId: string): string {
  return jwt.sign(
    { adminId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyAuthToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
    return decoded.adminId;
  } catch (error) {
    return null;
  }
}
