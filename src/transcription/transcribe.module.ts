import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscribeController } from './controllers/transcribe.controller';
import { TranscribeService } from './services/transcribe.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [TranscribeController],
  providers: [TranscribeService],
  exports: [TranscribeService],
})
export class TranscribeModule {}
