import { Role } from "@prisma/client";

export interface UserData {
    email: string;
    name: string;
    password: string;
    role?: Role;
  }