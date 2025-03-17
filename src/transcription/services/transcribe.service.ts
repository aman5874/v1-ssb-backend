import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TranscribeOptionsDto,
  UploadResponseDto,
} from '../dto/request/transcribe.dto';
import { TranscriptionResponseDto } from '../dto/response/transcription-response.dto';
import axios from 'axios';
import { FastifyRequest } from 'fastify';
import { AudioFile } from '../interfaces/transcribe.interface';

@Injectable()
export class TranscribeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.assemblyai.com/v2';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ASSEMBLYAI_API_KEY');
    if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY is not defined');
    this.apiKey = apiKey;
  }

  async uploadAudio(req: FastifyRequest): Promise<UploadResponseDto> {
    try {
      const file = await this.processUploadedFile(req);
      return await this.sendFileToAssemblyAI(file);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async processUploadedFile(req: FastifyRequest): Promise<AudioFile> {
    const data = await req.file();
    if (!data) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    const buffer = await data.toBuffer();
    const file = {
      buffer,
      mimetype: data.mimetype,
      originalname: data.filename,
      size: buffer.length,
    };

    this.logFileDetails(file);
    this.validateFile(file);

    return file;
  }

  private async sendFileToAssemblyAI(
    file: AudioFile,
  ): Promise<UploadResponseDto> {
    try {
      const response = await axios.post(`${this.baseUrl}/upload`, file.buffer, {
        headers: this.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      this.logUploadResponse(response.data);
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to upload to AssemblyAI',
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  private getHeaders() {
    return {
      Authorization: this.apiKey,
      'Content-Type': 'application/octet-stream',
      'Transfer-Encoding': 'chunked',
    };
  }

  private validateFile(file: AudioFile): void {
    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      throw new HttpException('File too large', HttpStatus.BAD_REQUEST);
    }

    if (!this.isValidAudioType(file.mimetype)) {
      throw new HttpException('Invalid file type', HttpStatus.BAD_REQUEST);
    }
  }

  private isValidAudioType(mimetype: string): boolean {
    const validTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/mp4',
      'audio/x-m4a',
      'audio/aac',
      'audio/ogg',
      'audio/flac',
    ];
    return validTypes.includes(mimetype);
  }

  private logFileDetails(file: AudioFile): void {
    console.log('Received file:', {
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    });
  }

  private logUploadResponse(response: any): void {
    console.log('Upload response:', response);
  }

  private handleError(error: any): never {
    console.error('Service error:', error);
    throw new HttpException(
      error.message || 'File upload failed',
      error.response?.status || HttpStatus.BAD_REQUEST,
    );
  }

  async transcribeAudio(options: TranscribeOptionsDto): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/transcript`, options, {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      return response.data.id;
    } catch (error) {
      throw new HttpException(
        'Failed to initiate transcription',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getTranscription(
    transcriptId: string,
  ): Promise<TranscriptionResponseDto> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transcript/${transcriptId}`,
        {
          headers: {
            Authorization: this.apiKey,
          },
        },
      );

      const transcription = response.data;

      // Ensure the response includes all required fields with correct types
      return transcription;
    } catch (error) {
      throw new HttpException(
        'Failed to get transcription',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async listTranscriptions(previousPageUrl?: string): Promise<any> {
    try {
      const url = previousPageUrl || `${this.baseUrl}/transcripts`;
      const response = await axios.get(url, {
        headers: {
          Authorization: this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to list transcriptions',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async sendWebhookNotification(
    webhookUrl: string,
    payload: any,
  ): Promise<void> {
    try {
      await axios.post(webhookUrl, payload);
    } catch (error) {
      console.error('Error sending webhook notification:', error);
      throw new HttpException(
        'Failed to send webhook notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Injectable()
export class WebhookService {
  async handleWebhook(data: any): Promise<void> {
    const { transcript_id, status } = data;

    if (!transcript_id) {
      throw new HttpException(
        'Transcript ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Process the webhook data
    if (status === 'completed') {
      console.log(`Transcription ${transcript_id} is completed.`);
      // Add logic to update the database or notify other services
    } else {
      console.log(`Transcription ${transcript_id} status: ${status}`);
    }
  }
}
