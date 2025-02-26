import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class Word {
  @IsString()
  text: string;

  @IsNumber()
  start: number;

  @IsNumber()
  end: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @IsString()
  @IsOptional()
  speaker?: string;
}

export class Utterance {
  @IsString()
  text: string;

  @IsNumber()
  start: number;

  @IsNumber()
  end: number;

  @IsString()
  speaker: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Word)
  words: Word[];
}

export class Chapter {
  @IsString()
  headline: string;

  @IsString()
  gist: string;

  @IsString()
  summary: string;

  @IsNumber()
  start: number;

  @IsNumber()
  end: number;
}

export class SentimentAnalysisResult {
  @IsString()
  text: string;

  @IsNumber()
  start: number;

  @IsNumber()
  end: number;

  @IsString()
  sentiment: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @IsString()
  @IsOptional()
  speaker?: string;
}

export class Entity {
  @IsString()
  entity_type: string;

  @IsString()
  text: string;

  @IsNumber()
  start: number;

  @IsNumber()
  end: number;
}
