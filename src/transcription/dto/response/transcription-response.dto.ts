import {
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TranscriptionStatus } from './transcription-status.enum';
import {
  Word,
  Utterance,
  Chapter,
  SentimentAnalysisResult,
  Entity,
} from './transcription-entities';
import {
  SpeechModel,
  RedactPiiAudioQuality,
} from '../request/transcribe.enums';

export class TranscriptionResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  audio_url: string;

  @IsEnum(TranscriptionStatus)
  status: TranscriptionStatus;

  @IsBoolean()
  webhook_auth: boolean;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Word)
  words?: Word[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Utterance)
  utterances?: Utterance[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsNumber()
  audio_duration?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Chapter)
  chapters?: Chapter[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SentimentAnalysisResult)
  sentiment_analysis_results?: SentimentAnalysisResult[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Entity)
  entities?: Entity[];

  @IsOptional()
  @IsEnum(SpeechModel)
  speech_model?: SpeechModel;

  @IsOptional()
  @IsString()
  language_code?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  language_confidence?: number;

  @IsOptional()
  @IsString()
  error?: string;

  // Feature flags
  @IsOptional()
  @IsBoolean()
  auto_highlights?: boolean;

  @IsOptional()
  @IsBoolean()
  redact_pii?: boolean;

  @IsOptional()
  @IsBoolean()
  summarization?: boolean;

  @IsOptional()
  @IsBoolean()
  language_detection?: boolean;

  @IsOptional()
  @IsBoolean()
  punctuate?: boolean;

  @IsOptional()
  @IsBoolean()
  format_text?: boolean;

  @IsOptional()
  @IsBoolean()
  disfluencies?: boolean;

  @IsOptional()
  @IsBoolean()
  multichannel?: boolean;

  @IsOptional()
  @IsBoolean()
  speaker_labels?: boolean;

  @IsOptional()
  @IsBoolean()
  content_safety?: boolean;

  @IsOptional()
  @IsBoolean()
  iab_categories?: boolean;

  @IsOptional()
  @IsBoolean()
  entity_detection?: boolean;

  // Configuration
  @IsOptional()
  @IsNumber()
  audio_start_from?: number;

  @IsOptional()
  @IsNumber()
  audio_end_at?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  word_boost?: string[];

  @IsOptional()
  @IsString()
  boost_param?: string;

  @IsOptional()
  @IsBoolean()
  redact_pii_audio?: boolean;

  @IsOptional()
  @IsEnum(RedactPiiAudioQuality)
  redact_pii_audio_quality?: RedactPiiAudioQuality;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  redact_pii_policies?: string[];

  @IsOptional()
  @IsNumber()
  speakers_expected?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  speech_threshold?: number;

  // Webhook related
  @IsOptional()
  @IsString()
  webhook_url?: string;

  @IsOptional()
  @IsNumber()
  webhook_status_code?: number;

  @IsOptional()
  @IsString()
  webhook_auth_header_name?: string;
}
