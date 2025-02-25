import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/users/user.database.service';
import {
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UsersService', () => {
  let service: UsersService;
  let databaseService: DatabaseService;

  const mockUser = {
    id: 1,
    userId: '12345',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser = {
    id: 2,
    userId: '12346',
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'hashedpassword',
    role: Role.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDatabaseService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users for admin', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValueOnce(mockAdminUser);
      mockDatabaseService.user.findMany.mockResolvedValueOnce([
        mockUser,
        mockAdminUser,
      ]);

      const result = await service.findAll(2);
      expect(result).toEqual([mockUser, mockAdminUser]);
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(service.findAll(1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return a user for admin', async () => {
      mockDatabaseService.user.findUnique
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(mockUser);

      const result = await service.findOne('12345', 2);
      expect(result).toEqual(mockUser);
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(service.findOne('12345', 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      };

      const hashedPassword = 'hashedpassword';
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);
      (jwt.sign as jest.Mock).mockReturnValueOnce('token');

      mockDatabaseService.user.create.mockResolvedValueOnce({
        ...mockUser,
        email: createUserDto.email,
        name: createUserDto.name,
      });

      const result = await service.register(createUserDto);
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(createUserDto.email);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockDatabaseService.user.findUnique.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('token');

      const result = await service.login(loginUserDto);
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(loginUserDto.email);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const loginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockDatabaseService.user.findUnique.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('update', () => {
    it('should update user profile', async () => {
      const updateUserDto = { name: 'Updated Name' };

      mockDatabaseService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);

      mockDatabaseService.user.update.mockResolvedValueOnce({
        ...mockUser,
        name: updateUserDto.name,
      });

      const result = await service.update('12345', updateUserDto, 1);
      expect(result.name).toBe(updateUserDto.name);
    });

    it('should throw ForbiddenException when updating other user profile', async () => {
      mockDatabaseService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockAdminUser);

      await expect(
        service.update('12346', { name: 'New Name' }, 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete user profile', async () => {
      mockDatabaseService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);

      mockDatabaseService.user.delete.mockResolvedValueOnce(mockUser);

      const result = await service.remove('12345', 1);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw ForbiddenException when deleting other user profile', async () => {
      mockDatabaseService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockAdminUser);

      await expect(service.remove('12346', 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
