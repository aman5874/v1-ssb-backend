import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscribeService } from './transcribe.service';
import { TranscribeOptionsDto } from './dto/transcribe.dto';
import { diskStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { FastifyRequest } from 'fastify';


@Controller('api')
@UseGuards(AuthGuard)
export class TranscribeController {
  constructor(private readonly transcribeService: TranscribeService) {}

  @Post('upload')
  async uploadFile(@Req() req: FastifyRequest) {
    return this.transcribeService.uploadAudio(req);
  }

  @Post('transcribe')
  async transcribe(@Body() options: TranscribeOptionsDto) {
    return this.transcribeService.transcribeAudio(options);
  }

  @Get('transcribe/:id')
  async getTranscription(@Param('id') id: string) {
    return this.transcribeService.getTranscription(id);
  }

  @Get('transcribe')
  async listTranscriptions(@Query('page') previousPageUrl?: string) {
    return this.transcribeService.listTranscriptions(previousPageUrl);
  }
}
