import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withOptimize } from '@prisma/extension-optimize';
import { withAccelerate } from '@prisma/extension-accelerate';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    super();
    // Add both Optimize and Accelerate extensions
    this.$extends(
      withOptimize({
        apiKey: configService.get('OPTIMIZE_API_KEY') || 'development',
      }),
    ).$extends(withAccelerate());
  }

  async onModuleInit() {
    await this.$connect();
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
