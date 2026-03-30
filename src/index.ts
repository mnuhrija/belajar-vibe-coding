import { Elysia } from 'elysia';
import { usersRoute } from './routes/users-route';

export const app = new Elysia()
  .use(usersRoute)
  .get('/', () => ({
    message: 'Hello Elysia',
    status: 'healthy'
  }));

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
