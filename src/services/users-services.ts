import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterUserInput) => {
  const { name, email, password } = input;

  // Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error('email sudah terdaftar');
  }

  // Hash password using Bun's built-in bcrypt
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  // Insert user
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return 'OK';
};
