import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { Role } from '@prisma/client';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureAdminExists', () => {
    it('should create admin if not exists', async () => {
      const mockAdmin = {
        id: 1,
        userId: '12345',
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'hashedpassword',
        role: Role.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        loginAt: new Date(),
      };

      jest.spyOn(service.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(service.user, 'create').mockResolvedValueOnce(mockAdmin);

      const result = await service.ensureAdminExists();
      expect(result).toEqual(mockAdmin);
    });

    it('should return existing admin', async () => {
      const mockAdmin = {
        id: 1,
        userId: '12345',
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'hashedpassword',
        role: Role.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        loginAt: new Date(),
      };

      jest.spyOn(service.user, 'findUnique').mockResolvedValueOnce(mockAdmin);

      const result = await service.ensureAdminExists();
      expect(result).toEqual(mockAdmin);
    });
  });

  describe('ensureTestUserExists', () => {
    it('should create test user if not exists', async () => {
      const mockUser = {
        id: 2,
        userId: '12346',
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        loginAt: new Date(),
      };

      jest.spyOn(service.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(service.user, 'create').mockResolvedValueOnce(mockUser);

      const result = await service.ensureTestUserExists();
      expect(result).toEqual(mockUser);
    });

    it('should return existing test user', async () => {
      const mockUser = {
        id: 2,
        userId: '12346',
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        loginAt: new Date(),
      };

      jest.spyOn(service.user, 'findUnique').mockResolvedValueOnce(mockUser);

      const result = await service.ensureTestUserExists();
      expect(result).toEqual(mockUser);
    });
  });

  describe('onModuleInit', () => {
    it('should connect to database', async () => {
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockResolvedValueOnce();
      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database', async () => {
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValueOnce();
      await service.onModuleDestroy();
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});
