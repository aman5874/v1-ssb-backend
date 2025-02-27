import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaClient, Prisma } from '@prisma/client';
import { withOptimize } from '@prisma/extension-optimize';
import { withAccelerate } from '@prisma/extension-accelerate';
import { withPulse } from '@prisma/extension-pulse';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Cache } from 'cache-manager';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: configService.get('DATABASE_URL_PRISMA'),
        },
      },
    });

    // Apply Prisma Extensions
    this.$extends(
      withOptimize({
        apiKey: configService.get('OPTIMIZE_API_KEY') || 'development',
      }),
    ).$extends(withAccelerate());
    // Apply caching extension
    this.$extends({
      name: 'cache',
      model: {
        user: {
          async findUnique(args: Prisma.UserFindUniqueArgs) {
            const cacheKey = `user:${JSON.stringify(args)}`;
            const cachedData = await cacheManager.get(cacheKey);
            if (cachedData) return cachedData;

            const result = await super.findUnique(args);
            if (result) await cacheManager.set(cacheKey, result, 60000);
            return result;
          },

          async findMany(args: Prisma.UserFindManyArgs) {
            const cacheKey = `users:${JSON.stringify(args)}`;
            const cachedData = await cacheManager.get(cacheKey);
            if (cachedData) return cachedData;

            const result = await super.findMany(args);
            if (result) await cacheManager.set(cacheKey, result, 60000);
            return result;
          },
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.startNotificationStream(); // Start the Prisma stream when the service initializes
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async startNotificationStream() {
    try {
      console.log('\x1b[36m%s\x1b[0m', '🔔 Starting notification stream...');

      const stream = await this.$extends(
        withPulse({
          apiKey: this.configService.get('PULSE_API_KEY') || 'development',
        }),
      ).notification.subscribe();

      console.log('\x1b[32m%s\x1b[0m', '✅ Notification stream connected');

      for await (const event of stream) {
        const timestamp = new Date().toLocaleString();
        console.log('\n\x1b[33m%s\x1b[0m', '📬 New Notification:');
        console.log('\x1b[36m%s\x1b[0m', '⏰ Time:', timestamp);

        if ('record' in event) {
          const record = event.record as { message: string; createdAt: Date };
          console.log('\x1b[35m%s\x1b[0m', '📝 Notification:', {
            message: record.message,
            createdAt: record.createdAt,
          });
        }

        console.log('\x1b[90m%s\x1b[0m', '-------------------');
      }
    } catch (error) {
      console.error(
        '\x1b[31m%s\x1b[0m',
        '❌ Error in notification stream:',
        error,
      );
    }
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
