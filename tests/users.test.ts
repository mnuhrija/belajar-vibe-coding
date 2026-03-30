import { expect, test, describe, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";

describe("User API Tests", () => {
  beforeEach(async () => {
    // Clear the database before each test to ensure consistency
    await db.delete(sessions);
    await db.delete(users);
  });

  // 1. Health Check
  test("GET / should return health status", async () => {
    const res = await app.handle(new Request("http://localhost/"));
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.message).toBe("Hello Elysia");
  });

  // 2. API Pendaftaran (Registrasi)
  describe("POST /api/users", () => {
    test("Successful registration", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Rija",
            email: "rija@gmail.com",
            password: "rahasia",
          }),
        })
      );
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.data).toBe("OK");
    });

    test("Duplicate email registration should fail", async () => {
      const payload = {
        name: "Rija",
        email: "rija@gmail.com",
        password: "rahasia",
      };

      // First registration
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );

      // Duplicate registration
      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Rija2",
            email: "rija@gmail.com",
            password: "password",
          }),
        })
      );
      const body = await res.json() as any;

      expect(res.status).toBe(400);
      expect(body.error).toBe("email sudah terdaftar");
    });

    test("Validation error (name too long) should fail", async () => {
      const longName = "A".repeat(300);
      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longName,
            email: "test@example.com",
            password: "password",
          }),
        })
      );

      expect(res.status).toBe(422);
    });
  });

  // 3. API Autentikasi (Login)
  describe("POST /api/users/login", () => {
    test("Successful login should return UUID token", async () => {
      // Register first
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Rija",
            email: "rija@gmail.com",
            password: "rahasia",
          }),
        })
      );

      // Login
      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "rija@gmail.com",
            password: "rahasia",
          }),
        })
      );
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(typeof body.data).toBe("string");
    });

    test("Wrong password should fail", async () => {
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Rija",
            email: "rija@gmail.com",
            password: "rahasia",
          }),
        })
      );

      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "rija@gmail.com",
            password: "wrong_password",
          }),
        })
      );
      const body = await res.json() as any;

      expect(res.status).toBe(400);
      expect(body.error).toBe("email atau password salah");
    });

    test("Non-existent email should fail", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "password",
          }),
        })
      );
      const body = await res.json() as any;

      expect(res.status).toBe(400);
      expect(body.error).toBe("email atau password salah");
    });
  });

  // 4. API Akses User Saat Ini (Get Profil)
  describe("GET /api/users/login", () => {
    test("Successful get profile with valid token", async () => {
      // Register and Login
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Rija",
            email: "rija@gmail.com",
            password: "rahasia",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "rija@gmail.com",
            password: "rahasia",
          }),
        })
      );
      const { data: token } = await loginRes.json() as any;

      // Get profile
      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.data.email).toBe("rija@gmail.com");
      expect(body.data.name).toBe("Rija");
      expect(body.data.id).toBeDefined();
    });

    test("Missing Authorization header should return 401", async () => {
      const res = await app.handle(new Request("http://localhost/api/users/login"));
      const body = await res.json() as any;

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    test("Invalid/manipulated token should return 401", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          headers: { Authorization: "Bearer 123-fake-token" },
        })
      );
      const body = await res.json() as any;

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });
  });

  // 5. API Penghancur Sesi (Logout User)
  describe("DELETE /api/users/logout", () => {
    test("Successful logout should remove session", async () => {
      // Register and Login
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Rija",
            email: "rija@gmail.com",
            password: "rahasia",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "rija@gmail.com",
            password: "rahasia",
          }),
        })
      );
      const { data: token } = await loginRes.json() as any;

      // Logout
      const res = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.data).toBe("OK");

      // Verify session death by trying to get profile
      const profileRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      const profileBody = await profileRes.json() as any;

      expect(profileRes.status).toBe(401);
      expect(profileBody.error).toBe("Unauthorized");
    });

    test("Logout with invalid token should fail", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: "Bearer wrong-token" },
        })
      );
      const body = await res.json() as any;

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });
  });
});
