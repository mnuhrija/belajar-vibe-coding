import { Elysia, t } from 'elysia';
import { registerUser, loginUser, getCurrentUser } from '../services/users-services';

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
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
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
        name: t.Optional(t.String()),
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get('/login', async ({ headers, set }) => {
    try {
      const authorization = headers['authorization'];
      if (!authorization || typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const token = authorization.split(' ')[1];
      if (!token) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

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
  });
