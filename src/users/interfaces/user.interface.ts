import { Role } from '@prisma/client';
import { FastifyRequest } from 'fastify';

export interface UserResponse {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface RegisterResponse {
  user: UserResponse;
  token: string;
}

export interface UserType extends UserResponse {
  id: number;
  password: string;
  loginAt?: Date;
}

export interface LoginResponse {
  user: UserResponse & { loginAt?: Date };
  token: string;
}

export interface RequestWithUser extends FastifyRequest {
  user: {
    userId: number;
    role: Role;
  };
}