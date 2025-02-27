import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaClient, Prisma, Role } from '@prisma/client';
import { withOptimize } from '@prisma/extension-optimize';
import { withAccelerate } from '@prisma/extension-accelerate';
import { withPulse } from '@prisma/extension-pulse';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';

type QueryEvent = {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
};

interface UserData {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseService.name);
  private isConnected = false;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: 'pretty',
    });

    // Apply Prisma Extensions for optimization
    this.$extends(
      withOptimize({
        apiKey: this.configService.get('OPTIMIZE_API_KEY') || 'development',
      }),
    )
      .$extends(withAccelerate())
      .$extends(
        withPulse({
          apiKey: this.configService.get('PULSE_API_KEY') || 'development',
        }),
      );

    // Add query logging with correct type
    (this as any).$on('query', (e: QueryEvent) => {
      this.logger.debug(`Query: ${e.query}`);
      this.logger.debug(`Params: ${e.params}`);
      this.logger.debug(`Duration: ${e.duration}ms`);
    });
  }

  async onModuleInit() {
    if (!this.isConnected) {
      await this.$connect();
      this.isConnected = true;
    }
  }

  private async getCachedUser(email: string) {
    const cacheKey = `user:${email}`;
    return this.cacheManager.get(cacheKey);
  }

  private async cacheUser(email: string, userData: any) {
    const cacheKey = `user:${email}`;
    await this.cacheManager.set(cacheKey, userData, 300); // 5 minutes
  }

  async createUserWithNotification(userData: UserData) {
    const cachedUser = await this.getCachedUser(userData.email);
    if (cachedUser) return cachedUser;

    // Create user first to minimize transaction time
    const user = await this.$transaction(
      async (prisma) => {
        return prisma.user.create({
          data: userData,
          select: {
            userId: true,
            email: true,
            name: true,
            role: true,
          },
        });
      },
      {
        timeout: 3000, // 3 second timeout
        maxWait: 1000, // 1 second max wait
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    // Fire and forget notification creation
    this.eventEmitter.emit('user.created', {
      userId: user.userId,
      email: user.email,
      message: `New user registered: ${user.email}`,
    });

    // Cache user data asynchronously
    this.cacheUser(user.email, user).catch((err) =>
      this.logger.error('Cache error:', err),
    );

    return user;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async ensureAdminExists() {
    const adminExists = await this.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      return this.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
    }
    return adminExists;
  }

  async ensureTestUserExists() {
    const userExists = await this.user.findUnique({
      where: { email: 'user@example.com' },
    });

    if (!userExists) {
      const hashedPassword = await bcrypt.hash('userpassword', 10);
      return this.user.create({
        data: {
          name: 'Test User',
          email: 'user@example.com',
          password: hashedPassword,
          role: 'USER',
        },
      });
    }
    return userExists;
  }
}
