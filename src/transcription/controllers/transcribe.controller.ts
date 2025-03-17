import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { TranscribeService } from '../services/transcribe.service';
import { TranscribeOptionsDto } from '../dto/request/transcribe.dto';
import { TranscriptionResponseDto } from '../dto/response/transcription-response.dto';
import { UploadResponseDto } from '../dto/request/transcribe.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { FastifyRequest } from 'fastify';
import { TranscribeValidationPipe } from '../pipes/transcribe-validation.pipe';
import { TranscribeResponseValidationPipe } from '../pipes/transcribe-response-validation.pipe';

@Controller('api')
@UseGuards(AuthGuard)
export class TranscribeController {
  constructor(private readonly transcribeService: TranscribeService) {}

  // Uploads audio file to the server
  @Post('upload')
  async uploadFile(@Req() req: FastifyRequest): Promise<UploadResponseDto> {
    return this.transcribeService.uploadAudio(req);
  }

  // Transcribes audio file
  @Post('transcribe')
  async transcribe(
    @Body(new TranscribeValidationPipe()) options: TranscribeOptionsDto,
  ): Promise<{ transcriptionId: string }> {
    const transcriptionId =
      await this.transcribeService.transcribeAudio(options);

    // Send the transcription ID to the specified webhook URL
    if (options.webhook_url) {
      await this.transcribeService.sendWebhookNotification(
        options.webhook_url,
        {
          transcript_id: transcriptionId,
          status: 'processing', // Initial status
          webhook_auth_header_name: options.webhook_auth_header_name,
          webhook_auth_header_value: options.webhook_auth_header_value,
        },
      );
    }

    return { transcriptionId };
  }

  // Gets a transcription by ID
  @Get('transcribe/:id')
  async getTranscription(
    @Param('id') id: string,
  ): Promise<TranscriptionResponseDto> {
    return this.transcribeService.getTranscription(id);
  }

  // Lists all transcriptions
  @Get('transcribe')
  @UseInterceptors(new TranscribeResponseValidationPipe())
  async listTranscriptions(
    @Query('page') previousPageUrl?: string,
  ): Promise<TranscriptionResponseDto[]> {
    return this.transcribeService.listTranscriptions(previousPageUrl);
  }
}
