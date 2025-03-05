import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class NotificationService {
  private prisma = new PrismaClient();
  private readonly logger = new Logger(NotificationService.name);

  @OnEvent('user.created')
  handleUserCreated(payload: {
    userId: string;
    email: string;
    message: string;
  }) {
    // Process notification after current event loop
    setImmediate(async () => {
      try {
        await this.prisma.notification.create({
          data: {
            message: payload.message,
          },
        });
        this.logger.debug(`Notification created for user: ${payload.email}`);
      } catch (error) {
        this.logger.error('Notification creation failed:', error);
      }
    });
  }
}
