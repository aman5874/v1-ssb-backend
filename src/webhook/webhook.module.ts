import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { TranscribeService } from '../transcribe/transcribe.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, TranscribeService],
})
export class WebhookModule {}
