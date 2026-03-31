# Belajar Vibe Coding - User Authentication API

## Tentang Aplikasi Ini

Aplikasi ini adalah sebuah RESTful API sederhana untuk sistem Autentikasi User (User Authentication). Aplikasi ini memiliki fitur dasar keamanan pengguna, meliputi:
- **Register User**: Mendaftarkan pengguna baru ke database.
- **Login User**: Mengautentikasi pengguna dan memberikan token sesi (session token).
- **Get Current User**: Mengambil data profil pengguna yang sedang login berdasarkan token.
- **Logout User**: Menghapus token sesi dari database sehingga pengguna tidak lagi login.

## Teknologi & Library yang Digunakan (Stack)

- **Runtime**: [Bun](https://bun.sh/) - Javascript runtime terintegrasi yang sangat cepat.
- **Framework**: [ElysiaJS](https://elysiajs.com/) - Web framework yang cepat dan optimal untuk Bun.
- **ORM (Object-Relational Mapping)**: [Drizzle ORM](https://orm.drizzle.team/) - ORM TypeScript yang ringan dengan performa tinggi.
- **Database**: PostgreSQL.
- **Bahasa Pemrograman**: TypeScript.

## Arsitektur & Struktur File

Aplikasi ini menggunakan struktur folder berlapis yang memisahkan definisi route, business logic, dan akses database.

```text
.
├── src/
│   ├── db/
│   │   ├── index.ts        # Konfigurasi koneksi database (Drizzle)
│   │   └── schema.ts       # Definisi skema tabel untuk database
│   ├── routes/
│   │   └── users-route.ts  # Definisi endpoint (Controller/Route) API Users
│   ├── services/
│   │   └── users-services.ts # Logika bisnis (Business Logic) aplikasi
│   └── index.ts            # Entry point aplikasi (Inisialisasi server ElysiaJS)
├── tests/
│   └── users.test.ts       # File unit/integration testing
├── drizzle/                # Direktori otomatis yang dibuat Drizzle (migrasi)
├── drizzle.config.ts       # Konfigurasi dari Drizzle Kit
├── package.json            # Daftar dependensi dan script NPM/Bun
└── tsconfig.json           # Konfigurasi TypeScript
```

## Schema Database

Database PostgreSQL menggunakan skema berikut:

### Table `users`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | serial (int) | Primary Key |
| `name` | varchar(255) | Not Null |
| `email` | varchar(255) | Not Null, Unique |
| `password` | varchar(255) | Not Null |
| `createdAt` | timestamp | Default Now, Not Null |

### Table `sessions`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | serial (int) | Primary Key |
| `token` | varchar(255) | Not Null, Unique |
| `userId` | integer | Foreign Key references `users.id`, Not Null |
| `createdAt` | timestamp | Default Now, Not Null |

## API yang Tersedia

Berikut adalah endpoint API yang tersedia di aplikasi ini:

### 1. Register User
- **Method**: `POST`
- **URL**: `/api/users/`
- **Request Body (JSON)**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secretpassword"
  }
  ```
- **Response**: Mengembalikan data user yang berhasil diregistrasi (tanpa password).

### 2. Login User
- **Method**: `POST`
- **URL**: `/api/users/login`
- **Request Body (JSON)**:
  ```json
  {
    "email": "john@example.com",
    "password": "secretpassword"
  }
  ```
- **Response**: Mengembalikan UUID token sesi (misal: `"data": "uuid-token-string"`).

### 3. Get Current User
- **Method**: `GET`
- **URL**: `/api/users/login` *(catatan: URL untuk mendapatkan current user dapat diakses melalui GET `/api/users/login`)*
- **Headers**:
  - `Authorization`: `Bearer <sesi_token>`
- **Response**: Mengembalikan profil data dari owner sesi tersebut.

### 4. Logout User
- **Method**: `DELETE`
- **URL**: `/api/users/logout`
- **Headers**:
  - `Authorization`: `Bearer <sesi_token>`
- **Response**: Menerima message "OK" dan menghapus token dari database.

## Cara Setup Project

1. **Pastikan prasyarat terinstall**:
   - [Bun](https://bun.sh/)
   - PostgreSQL (sedang berjalan dalam server secara sistem lokal atau Docker)

2. **Clone atau jalankan repo ini**.

3. **Install Dependencies**:
   ```bash
   bun install
   ```

4. **Konfigurasi Environment**:
   - Rename/Copy atau Buat file bernama `.env`.
   - Setup URL Database PostgreSQL Anda.
   ```env
   DATABASE_URL="postgres://postgres:password@localhost:5432/belajar_vibe_coding"
   ```

## Migrasi Database (Database Setup)

Jalankan perintah berikut untuk mensinkronisasi schema Drizzle dengan database PostgreSQL Anda.

```bash
bun run db:generate
bun run db:push
```

## Cara Run Aplikasi

Jalankan aplikasi ini dalam mode development menggunakan:

```bash
bun run dev
```

Akan muncul pesan log di konsol (`🦊 Elysia is running at localhost:3000`).

## Cara Test Aplikasi

Project ini sudah dilengkapi unit/integration tests menggunakan test-runner bawaan Bun.

Untuk menjalankan seluruh test (contohnya memastikan proses register dan login berfungsi baik):
```bash
bun test
```
