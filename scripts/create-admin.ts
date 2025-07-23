import { db } from "../server/db";
import { admins } from "../shared/schema";
import { hashPassword } from "../server/lib/auth";
import { eq } from "drizzle-orm";

async function createAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];
  const email = process.argv[4];

  if (!username || !password || !email) {
    console.log("Usage: tsx scripts/create-admin.ts <username> <password> <email>");
    console.log("Example: tsx scripts/create-admin.ts admin password123 admin@christslovinghands.org");
    process.exit(1);
  }

  try {
    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username));

    if (existingAdmin) {
      console.log(`Admin user '${username}' already exists!`);
      process.exit(1);
    }

    // Hash password and create admin
    const passwordHash = await hashPassword(password);
    
    const [newAdmin] = await db
      .insert(admins)
      .values({
        username,
        passwordHash,
        email,
      })
      .returning();

    console.log(`✓ Admin user created successfully!`);
    console.log(`Username: ${newAdmin.username}`);
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Login at: /admin/login`);
    
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

createAdmin();