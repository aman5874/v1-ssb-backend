import { Role } from '@prisma/client';

export interface UserResponse {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginResponse{
    user: UserResponse;
    token: string;
}

export interface RegisterResponse {
  user: UserResponse;
  token: string;
}
