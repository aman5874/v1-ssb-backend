import { Controller, Post, Body } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async receiveWebhook(@Body() data: any): Promise<void> {
    const { transcript_id, status } = data;

    // Process the webhook data
    await this.webhookService.handleWebhook(transcript_id, status);
  }
}
