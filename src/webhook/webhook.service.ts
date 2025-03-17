import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { TranscribeService } from '../transcription/services/transcribe.service';

@Injectable()
export class WebhookService {
  constructor(private readonly transcribeService: TranscribeService) {}

  async handleWebhook(transcriptId: string, status: string): Promise<void> {
    if (!transcriptId) {
      throw new HttpException(
        'Transcript ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check the status of the transcription
    if (status === 'completed') {
      console.log(`Transcription ${transcriptId} is completed.`);
      // You can add logic here to update the database or notify other services
    } else {
      console.log(`Transcription ${transcriptId} status: ${status}`);
    }
  }
}
