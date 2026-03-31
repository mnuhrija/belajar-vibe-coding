import { Elysia, t } from 'elysia';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from '../services/users-services';

export const usersRoute = new Elysia({ prefix: '/api/users' })
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const result = await registerUser(body);
        return { data: result };
      } catch (error: any) {
        if (error.message === 'email sudah terdaftar') {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        name: t.String({ maxLength: 255 }),
        email: t.String({ maxLength: 255 }),
        password: t.String({ maxLength: 255 }),
      }),
      detail: {
        summary: 'Register User',
        tags: ['Users'],
      },
      response: {
        200: t.Object({ data: t.String() }, { description: 'Registrasi Berhasil' }),
        400: t.Object({ error: t.String() }, { description: 'Email Sudah Terdaftar' }),
        500: t.Object({ error: t.String() }, { description: 'Internal Server Error' }),
      },
    }
  )
  .post(
    '/login',
    async ({ body, set }) => {
      try {
        const token = await loginUser(body);
        return { data: token };
      } catch (error: any) {
        if (error.message === 'email atau password salah') {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ maxLength: 255 })),
        email: t.String({ maxLength: 255 }),
        password: t.String({ maxLength: 255 }),
      }),
      detail: {
        summary: 'Login User',
        tags: ['Users'],
      },
      response: {
        200: t.Object({ data: t.String() }, { description: 'Login Berhasil, Return Token' }),
        400: t.Object({ error: t.String() }, { description: 'Email atau Password Salah' }),
        500: t.Object({ error: t.String() }, { description: 'Internal Server Error' }),
      },
    }
  )
  .derive(({ headers }) => {
    const authorization = headers['authorization'];
    if (
      !authorization ||
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      return { token: null };
    }

    const token = authorization.split(' ')[1];
    return { token: token || null };
  })
  .get(
    '/login',
    async ({ token, set }) => {
      if (!token) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      try {
        const user = await getCurrentUser(token);
        return { data: user };
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          set.status = 401;
          return { error: error.message };
        }
        set.status = 500;
        return { error: 'Internal Server Error' };
      }
    },
    {
      detail: {
        summary: 'Get Current User Profile',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number(),
            name: t.String(),
            email: t.String(),
            createdAt: t.Date(),
          }),
        }, { description: 'Data Profil Berhasil Diambil' }),
        401: t.Object({ error: t.String() }, { description: 'Unauthorized' }),
        500: t.Object({ error: t.String() }, { description: 'Internal Server Error' }),
      },
    }
  )
  .delete(
    '/logout',
    async ({ token, set }) => {
      if (!token) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      try {
        await logoutUser(token);
        return { data: 'OK' };
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          set.status = 401;
          return { error: error.message };
        }
        set.status = 500;
        return { error: 'Internal Server Error' };
      }
    },
    {
      detail: {
        summary: 'Logout User',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({ data: t.String() }, { description: 'Logout Berhasil' }),
        401: t.Object({ error: t.String() }, { description: 'Unauthorized' }),
        500: t.Object({ error: t.String() }, { description: 'Internal Server Error' }),
      },
    }
  );
