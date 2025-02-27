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
import { TranscribeService } from './transcribe.service';
import { TranscribeOptionsDto } from './dto/request/transcribe.dto';
import { TranscriptionResponseDto } from './dto/response/transcription-response.dto';
import { UploadResponseDto } from './dto/request/transcribe.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { FastifyRequest } from 'fastify';
import { TranscribeValidationPipe } from './pipes/transcribe-validation.pipe';
import { TranscribeResponseValidationPipe } from './pipes/transcribe-response-validation.pipe';

@Controller('api')
@UseGuards(AuthGuard)
export class TranscribeController {
  constructor(private readonly transcribeService: TranscribeService) {}

  @Post('upload')
  async uploadFile(@Req() req: FastifyRequest): Promise<UploadResponseDto> {
    return this.transcribeService.uploadAudio(req);
  }

  @Post('transcribe')
  async transcribe(
    @Body(new TranscribeValidationPipe()) options: TranscribeOptionsDto,
  ): Promise<string> {
    return this.transcribeService.transcribeAudio(options);
  }

  @Get('transcribe/:id')
  @UseInterceptors(new TranscribeResponseValidationPipe())
  async getTranscription(
    @Param('id') id: string,
  ): Promise<TranscriptionResponseDto> {
    return this.transcribeService.getTranscription(id);
  }

  @Get('transcribe')
  @UseInterceptors(new TranscribeResponseValidationPipe())
  async listTranscriptions(
    @Query('page') previousPageUrl?: string,
  ): Promise<TranscriptionResponseDto[]> {
    return this.transcribeService.listTranscriptions(previousPageUrl);
  }
}
