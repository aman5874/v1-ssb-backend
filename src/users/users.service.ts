import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../database/users/user.database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  private generateToken(user: any): string {
    return jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' },
    );
  }

  async findAll(userId: number) {
    const cacheKey = 'users:all';
    let users = await this.cacheManager.get(cacheKey);

    if (!users) {
      users = await this.db.user.findMany({
        select: {
          userId: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      await this.cacheManager.set(cacheKey, users, 60000); // Cache for 1 minute
    }

    return users;
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
      },
    });

    // Create notification after successful registration
    await this.db.notification.create({
      data: {
        message: `New user registered: ${user.email}`,
      },
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(loginUserDto: LoginUserDto) {
    const cacheKey = `user:${loginUserDto.email}`;
    type UserType = {
      id: number;
      userId: string;
      email: string;
      password: string;
      role: string;
    };

    let user: UserType | null = await this.cacheManager.get(cacheKey);

    if (!user) {
      user = await this.db.user.findUnique({
        where: { email: loginUserDto.email },
        select: {
          id: true,
          userId: true,
          email: true,
          password: true,
          role: true,
        },
      });
      await this.cacheManager.set(cacheKey, user, 300000); // Cache for 5 minutes
    }

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

    const user = await this.db.user.update({
      where: { userId },
      data: updateUserDto,
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Create notification after successful update
    await this.db.notification.create({
      data: {
        message: `User updated: ${user.email}`,
      },
    });

    return user;
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

    const user = await this.db.user.delete({
      where: { userId },
    });

    // Create notification after successful deletion
    await this.db.notification.create({
      data: {
        message: `User deleted: ${user.email}`,
      },
    });

    return { message: 'User deleted successfully' };
  }

  async initializeUsers() {
    await this.db.ensureAdminExists();
    await this.db.ensureTestUserExists();
    return { message: 'Users initialized successfully' };
  }

}
