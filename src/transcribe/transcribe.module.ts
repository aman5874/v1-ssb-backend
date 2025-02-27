import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscribeController } from './transcribe.controller';
import { TranscribeService } from './transcribe.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [TranscribeController],
  providers: [TranscribeService],
})
export class TranscribeModule {}
