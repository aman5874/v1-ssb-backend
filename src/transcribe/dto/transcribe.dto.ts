export class TranscribeOptionsDto {
  audio_url?: string;
  audio_end_at?: number;
  audio_start_from?: number;
  auto_chapters?: boolean;
  auto_highlights?: boolean;
  boost_param?: 'low' | 'medium' | 'high';
  content_safety?: boolean;
  custom_spelling?: Array<{ from: string[]; to: string }>;
  disfluencies?: boolean;
  entity_detection?: boolean;
  filter_profanity?: boolean;
  format_text?: boolean;
  iab_categories?: boolean;
  language_code?: string;
  language_detection?: boolean;
  multichannel?: boolean;
  punctuate?: boolean;
  redact_pii?: boolean;
  redact_pii_audio?: boolean;
  redact_pii_audio_quality?: 'low' | 'medium' | 'high' | 'mp3';
  redact_pii_policies?: string[];
  sentiment_analysis?: boolean;
  speaker_labels?: boolean;
  speakers_expected?: number;
  speech_threshold?: number;
  summarization?: boolean;
  summary_model?: 'informative' | 'conversational';
  summary_type?: 'bullets' | 'paragraph' | 'gist';
  topics?: string[];
  word_boost?: string[];
  custom_topics?: boolean;
  dual_channel?: boolean;
}

export class UploadResponseDto {
  upload_url: string;
}

export class TranscriptionResponseDto {
  id: string;
  status: string;
  text: string;
  // Add other fields as needed
}
