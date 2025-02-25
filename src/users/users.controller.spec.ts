import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/users/user.database.service';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

interface RequestWithUser extends FastifyRequest {
  user: {
    userId: number;
    role: Role;
  };
}

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: 1,
    userId: '12345',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser = {
    id: 2,
    userId: '12346',
    email: 'admin@example.com',
    name: 'Admin User',
    role: Role.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    initializeUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: DatabaseService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const expectedResponse = {
        user: {
          userId: '12345',
          email: 'test@example.com',
          name: 'Test User',
          role: Role.USER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'jwt-token',
      };

      jest.spyOn(service, 'register').mockResolvedValue(expectedResponse);

      const result = await controller.register(createUserDto);
      expect(result).toEqual(expectedResponse);
      expect(service.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse = {
        user: {
          userId: '12345',
          email: 'test@example.com',
          name: 'Test User',
          role: Role.USER,
          loginAt: new Date(),
        },
        token: 'jwt-token',
      };

      jest.spyOn(service, 'login').mockResolvedValue(expectedResponse);

      const result = await controller.login(loginUserDto);
      expect(result).toEqual(expectedResponse);
      expect(service.login).toHaveBeenCalledWith(loginUserDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest
        .spyOn(service, 'login')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginUserDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all users for admin', async () => {
      const req = {
        user: { userId: 2, role: Role.ADMIN },
        id: 'request-id',
        params: {},
        query: {},
        body: {},
        headers: {},
        raw: {},
        server: {},
        log: {} as any,
      } as unknown as RequestWithUser;

      const expectedUsers = [mockUser, mockAdminUser];
      mockUsersService.findAll.mockResolvedValue(expectedUsers);

      const result = await controller.findAll(req);
      expect(result).toEqual(expectedUsers);
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      const req = {
        user: { userId: 1, role: Role.USER },
        id: 'request-id',
        params: {},
        query: {},
        body: {},
        headers: {},
        raw: {},
        server: {},
        log: {} as any,
      } as unknown as RequestWithUser;

      mockUsersService.findAll.mockRejectedValue(
        new ForbiddenException('Only admins can view all users'),
      );

      await expect(controller.findAll(req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID for admin', async () => {
      const req = {
        user: { userId: 2, role: Role.ADMIN },
        id: 'request-id',
        params: {},
        query: {},
        body: {},
        headers: {},
        raw: {},
        server: {},
        log: {} as any,
      } as unknown as RequestWithUser;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      const result = await controller.findOne('12345', req);
      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('12345', req.user.userId);
    });
  });

  describe('update', () => {
    it('should update user profile', async () => {
      const req = {
        user: { userId: 1, role: Role.USER },
        id: 'request-id',
        params: {},
        query: {},
        body: {},
        headers: {},
        raw: {},
        server: {},
        log: {} as any,
      } as unknown as RequestWithUser;

      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      jest.spyOn(service, 'update').mockResolvedValue(updatedUser);

      const result = await controller.update('12345', updateUserDto, req);
      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(
        '12345',
        updateUserDto,
        req.user.userId,
      );
    });
  });

  describe('remove', () => {
    it('should delete user profile', async () => {
      const req = {
        user: { userId: 1, role: Role.USER },
        id: 'request-id',
        params: {},
        query: {},
        body: {},
        headers: {},
        raw: {},
        server: {},
        log: {} as any,
      } as unknown as RequestWithUser;

      const expectedResponse = { message: 'User deleted successfully' };

      jest.spyOn(service, 'remove').mockResolvedValue(expectedResponse);

      const result = await controller.remove('12345', req);
      expect(result).toEqual(expectedResponse);
      expect(service.remove).toHaveBeenCalledWith('12345', req.user.userId);
    });
  });

  describe('initializeUsers', () => {
    it('should initialize default users', async () => {
      const expectedResponse = { message: 'Users initialized successfully' };

      jest
        .spyOn(service, 'initializeUsers')
        .mockResolvedValue(expectedResponse);

      const result = await controller.initializeUsers();
      expect(result).toEqual(expectedResponse);
      expect(service.initializeUsers).toHaveBeenCalled();
    });
  });
});
