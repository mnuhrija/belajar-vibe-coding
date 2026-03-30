import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Fungsi ini akan mengecek apakah email sudah terdaftar, melakukan hashing pada password,
 * dan menyimpan data pengguna baru ke dalam database.
 * 
 * @param {RegisterUserInput} input - Data masukan untuk registrasi (name, email, password)
 * @returns {Promise<string>} Kembalian string 'OK' jika registrasi sukses
 * @throws {Error} Melemparkan error jika email sudah terdaftar
 */
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

/**
 * Mengautentikasi pengguna secara aman untuk membuat sesi login.
 * Fungsi ini memverifikasi kecocokan antara email dan password. Jika valid, ia akan
 * membuat UUID baru sebagai token, menyimpan sesi ke tabel sessions, dan mereturn token tersebut.
 * 
 * @param {LoginUserInput} input - Kredensial pengguna masukan (email, password)
 * @returns {Promise<string>} UUID yang mewakili token sesi pengguna yang login
 * @throws {Error} Melemparkan error jika kombinasi email atau password salah
 */
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

/**
 * Mengambil profil data pengguna yang berstatus sedang login menggunakan token.
 * Fungsi ini melakukan join antara tabel sesi dan tabel utilitas users untuk mengembalikan
 * identitas yang disesuaikan dalam return.
 * 
 * @param {string} token - Token sesi milik pengguna dengan autorisasi Beare. 
 * @returns {Promise<Object>} Profil pengguna (id, name, email, dan createdAt)
 * @throws {Error} Melemparkan error Unauthorized jika token tidak ada di dalam database
 */
export const getCurrentUser = async (token: string) => {
  const [session] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
};

/**
 * Mencabut atau menghentikan masa akses sesi yang aktif agar user bisa di log out.
 * Fungsi ini akan memverifikasi token sesi dan jika valid, akan dihapus di dalam db.
 * 
 * @param {string} token - Token sesi yang akan dihancurkan
 * @returns {Promise<string>} Kembalian string 'OK' jika logout aman
 * @throws {Error} Melemparkan error Unauthorized jika token tidak valid/ditemukan
 */
export const logoutUser = async (token: string) => {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw new Error('Unauthorized');
  }

  await db.delete(sessions).where(eq(sessions.token, token));

  return 'OK';
};
