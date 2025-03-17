import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray, ValidateNested, Min, Max, IsUrl, ArrayMinSize, IsNotEmpty, Matches, } from 'class-validator';
import { Type } from 'class-transformer';
import { BoostParam, RedactPiiAudioQuality, SpeechModel, SummaryModel, SummaryType,
} from './transcribe.enums';
import { CustomSpelling } from './transcribe.interfaces';

export class TranscribeOptionsDto {
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  audio_url: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  audio_end_at?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  audio_start_from?: number;

  @IsOptional()
  @IsBoolean()
  auto_chapters?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_highlights?: boolean;

  @IsOptional()
  @IsEnum(BoostParam)
  boost_param?: BoostParam;

  @IsOptional()
  @IsBoolean()
  content_safety?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(25)
  @Max(100)
  content_safety_confidence?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomSpelling)
  custom_spelling?: CustomSpelling[];

  @IsOptional()
  @IsBoolean()
  disfluencies?: boolean;

  @IsOptional()
  @IsBoolean()
  entity_detection?: boolean;

  @IsOptional()
  @IsBoolean()
  filter_profanity?: boolean;

  @IsOptional()
  @IsBoolean()
  format_text?: boolean;

  @IsOptional()
  @IsBoolean()
  iab_categories?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}_[a-z]{2}$/)
  language_code?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  language_confidence_threshold?: number;

  @IsOptional()
  @IsBoolean()
  language_detection?: boolean;

  @IsOptional()
  @IsBoolean()
  multichannel?: boolean;

  @IsOptional()
  @IsBoolean()
  punctuate?: boolean;

  @IsOptional()
  @IsBoolean()
  redact_pii?: boolean;

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
  @IsEnum(['entity_name', 'hash'])
  redact_pii_sub?: 'entity_name' | 'hash';

  @IsOptional()
  @IsBoolean()
  sentiment_analysis?: boolean;

  @IsOptional()
  @IsBoolean()
  speaker_labels?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  speakers_expected?: number;

  @IsOptional()
  @IsEnum(SpeechModel)
  speech_model?: SpeechModel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  speech_threshold?: number;

  @IsOptional()
  @IsBoolean()
  summarization?: boolean;

  @IsOptional()
  @IsEnum(SummaryModel)
  summary_model?: SummaryModel;

  @IsOptional()
  @IsEnum(SummaryType)
  summary_type?: SummaryType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  topics?: string[];

  @IsOptional()
  @IsString()
  webhook_auth_header_name?: string;

  @IsOptional()
  @IsString()
  webhook_auth_header_value?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  webhook_url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  word_boost?: string[];

  @IsOptional()
  @IsBoolean()
  custom_topics?: boolean;

  @IsOptional()
  @IsBoolean()
  dual_channel?: boolean;
}

export class UploadResponseDto {
  upload_url: string;
}
