import { db } from '../db';
import { users, sessions } from '../db/schema';
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

export interface LoginUserInput {
  email: string;
  password: string;
}

export const loginUser = async (input: LoginUserInput) => {
  const { email, password } = input;

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error('email atau password salah');
  }

  // Verify password
  const isPasswordValid = await Bun.password.verify(password, user.password);
  if (!isPasswordValid) {
    throw new Error('email atau password salah');
  }

  // Generate session token
  const token = crypto.randomUUID();

  // Store session
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
};
