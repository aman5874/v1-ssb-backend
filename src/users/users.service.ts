import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async findAll(userId: number) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view all users');
    }
    return this.db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(userId: string, requestingUserId: number) {
    const requestingUser = await this.db.user.findUnique({
      where: { id: requestingUserId },
    });
    if (!requestingUser || requestingUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view user details');
    }

    const user = await this.db.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async register(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.db.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' },
    );

    return { user, token };
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.db.user.findUnique({
      where: { email: loginUserDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update login timestamp
    const updatedUser = await this.db.user.update({
      where: { id: user.id },
      data: { loginAt: new Date() },
    });

    const token = jwt.sign(
      { userId: updatedUser.id, role: updatedUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' },
    );

    return {
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        loginAt: updatedUser.loginAt,
      },
      token,
    };
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    requestingUserId: number,
  ) {
    const requestingUser = await this.db.user.findUnique({
      where: { id: requestingUserId },
    });
    const targetUser = await this.db.user.findUnique({
      where: { userId },
    });

    if (
      !requestingUser ||
      !targetUser ||
      (requestingUser.role !== 'ADMIN' && requestingUser.id !== targetUser.id)
    ) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.db.user.update({
      where: { userId },
      data: updateUserDto,
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async remove(userId: string, requestingUserId: number) {
    const requestingUser = await this.db.user.findUnique({
      where: { id: requestingUserId },
    });
    const targetUser = await this.db.user.findUnique({
      where: { userId },
    });

    if (
      !requestingUser ||
      !targetUser ||
      (requestingUser.role !== 'ADMIN' && requestingUser.id !== targetUser.id)
    ) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    await this.db.user.delete({ where: { userId } });
    return { message: 'User deleted successfully' };
  }

  async initializeUsers() {
    await this.db.ensureAdminExists();
    await this.db.ensureTestUserExists();
    return { message: 'Users initialized successfully' };
  }
}
