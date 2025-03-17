import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/users/user.database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserResponse, UserType, LoginResponse } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private eventEmitter: EventEmitter2,
  ) {}

  private generateToken(user: UserResponse): Promise<string> {
    return new Promise((resolve) => {
      const token = jwt.sign(
        { userId: user.userId, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' },
      );
      resolve(token);
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
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
    try {
      // Start password hashing early
      const passwordPromise = this.hashPassword(createUserDto.password);

      // Check cache first
      const cachedUser = await this.cacheManager.get<UserResponse>(
        `user:${createUserDto.email}`,
      );
      if (cachedUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Wait for password hash
      const hashedPassword = await passwordPromise;

      // Create user with transaction
      const user = (await this.db.createUserWithNotification({
        ...createUserDto,
        password: hashedPassword,
      })) as UserResponse;

      // Generate token in parallel with cache operation
      const [token] = await Promise.all([
        this.generateToken(user),
        this.cacheManager.set(
          `user:${user.email}`,
          user,
          300, // 5 minutes
        ),
        // Emit events asynchronously
        this.eventEmitter.emit('user.registered', user),
      ]);

      return { user, token };
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginResponse> {
    const cacheKey = `user:${loginUserDto.email}`;
    const logger = new Logger('LoginService');

    try {
      // Debug cache operations
      logger.debug(`Checking cache for key: ${cacheKey}`);
      let user = await this.cacheManager.get<UserType>(cacheKey);
      logger.debug(`Cache result: ${JSON.stringify(user)}`);

      if (!user) {
        const dbUser = await this.db.user.findUnique({
          where: { email: loginUserDto.email },
          select: {
            id: true,
            userId: true,
            email: true,
            password: true,
            role: true,
            name: true,
            loginAt: true,
          },
        });

        if (!dbUser) {
          throw new UnauthorizedException('Invalid email or password');
        }

        // Explicitly set cache after DB fetch
        logger.debug(`Setting cache for key: ${cacheKey}`);
        await this.cacheManager.set(
          cacheKey,
          {
            ...dbUser,
            loginAt: dbUser.loginAt || undefined,
          },
          300,
        );
        logger.debug('Cache set complete');

        user = dbUser as UserType;
      }

      const isPasswordValid = await bcrypt.compare(
        loginUserDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        logger.warn(
          `Login attempt failed: Invalid password - ${loginUserDto.email}`,
        );
        throw new UnauthorizedException('Invalid email or password');
      }

      // Update login timestamp
      const updatedUser = await this.db.user.update({
        where: { id: user.id },
        data: { loginAt: new Date() },
        select: {
          userId: true,
          email: true,
          name: true,
          role: true,
          loginAt: true,
        },
      });

      logger.log(`Successful login for user: ${user.email}`);

      const token = await this.generateToken({
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // Update cache after successful login
      logger.debug('Updating cache after login');
      await this.cacheManager.set(
        cacheKey,
        {
          ...updatedUser,
          loginAt: updatedUser.loginAt || undefined,
        },
        300,
      );
      logger.debug('Cache update complete');

      return {
        user: {
          userId: updatedUser.userId,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          loginAt: updatedUser.loginAt || undefined,
        },
        token,
      };
    } catch (error) {
      logger.error(`Cache operation failed: ${error.message}`);
      throw error;
    }
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
