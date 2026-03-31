import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { usersRoute } from './routes/users-route';

export const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Belajar Vibe Coding API',
          version: '1.0.0',
          description: 'API Documentation for User Authentication System',
        },
        tags: [
          { name: 'Users', description: 'User Authentication Endpoints' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    })
  )
  .use(usersRoute)
  .get('/', () => ({
    message: 'Hello Elysia',
    status: 'healthy'
  }));

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
