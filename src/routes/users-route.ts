import { Elysia, t } from 'elysia';
import { registerUser } from '../services/users-services';

export const usersRoute = new Elysia({ prefix: '/api' }).post(
  '/users',
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
);
