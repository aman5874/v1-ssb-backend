import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './../src/app.module';
import { Role } from '@prisma/client';
import { DatabaseService } from '../src/database/users/user.database.service';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;
  let databaseService: DatabaseService;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    databaseService = app.get<DatabaseService>(DatabaseService);
  });

  beforeEach(async () => {
    // Initialize users and get tokens
    const response = await app.inject({
      method: 'POST',
      url: '/user/initialize',
    });
    expect(response.statusCode).toBe(201);

    // Login as admin
    const adminLogin = await app.inject({
      method: 'POST',
      url: '/user/login',
      payload: {
        email: 'admin@example.com',
        password: 'adminpassword',
      },
    });
    adminToken = JSON.parse(adminLogin.payload).token;

    // Login as regular user
    const userLogin = await app.inject({
      method: 'POST',
      url: '/user/login',
      payload: {
        email: 'user@example.com',
        password: 'userpassword',
      },
    });
    userToken = JSON.parse(userLogin.payload).token;
  });

  describe('AppController', () => {
    it('/ (GET)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });
      expect(response.statusCode).toBe(200);
      expect(response.payload).toContain('Server is running');
    });

    it('/health (GET)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });
      expect(response.statusCode).toBe(200);
      const health = JSON.parse(response.payload);
      expect(health).toHaveProperty('status', 'OK');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
    });

    it('/version (GET)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/version',
      });
      expect(response.statusCode).toBe(200);
      const version = JSON.parse(response.payload);
      expect(version).toHaveProperty('version');
      expect(version).toHaveProperty('environment');
    });
  });

  describe('UsersController (e2e)', () => {
    it('/user/register (POST)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/user/register',
        payload: {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        },
      });
      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('email', 'newuser@example.com');
    });

    it('/user (GET) - Admin access', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/user',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });
      expect(response.statusCode).toBe(200);
      const users = JSON.parse(response.payload);
      expect(Array.isArray(users)).toBeTruthy();
    });

    it('/user (GET) - User access denied', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/user',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });
      expect(response.statusCode).toBe(403);
    });

    it('/user/:id (GET) - Admin access', async () => {
      // First get a user ID
      const users = await databaseService.user.findMany();
      const testUser = users[0];

      const response = await app.inject({
        method: 'GET',
        url: `/user/${testUser.userId}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });
      expect(response.statusCode).toBe(200);
      const user = JSON.parse(response.payload);
      expect(user).toHaveProperty('userId', testUser.userId);
    });

    it('/user/:id (PATCH) - Update own profile', async () => {
      // Get user's ID
      const users = await databaseService.user.findMany();
      const testUser = users.find((u) => u.role === Role.USER);
      if (!testUser) {
        throw new Error('Test user not found');
      }

      const response = await app.inject({
        method: 'PATCH',
        url: `/user/${testUser.userId}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          name: 'Updated Name',
        },
      });
      expect(response.statusCode).toBe(200);
      const updated = JSON.parse(response.payload);
      expect(updated).toHaveProperty('name', 'Updated Name');
    });

    it('/user/:id (DELETE) - Delete own profile', async () => {
      // Get user's ID
      const users = await databaseService.user.findMany();
      const testUser = users.find((u) => u.role === Role.USER);
      if (!testUser) {
        throw new Error('Test user not found');
      }

      const response = await app.inject({
        method: 'DELETE',
        url: `/user/${testUser.userId}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('message', 'User deleted successfully');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
