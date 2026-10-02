declare module 'whisper-node' {
  export type ModelName =
    | 'tiny'
    | 'tiny.en'
    | 'base'
    | 'base.en'
    | 'small'
    | 'small.en'
    | 'medium'
    | 'medium.en'
    | 'large-v1'
    | 'large';

  export interface WhisperOptions {
    /** Output a .txt transcript file */
    gen_file_txt?: boolean;
    /** Output a .srt subtitle file */
    gen_file_subtitle?: boolean;
    /** Output a .vtt file */
    gen_file_vtt?: boolean;
    /** Add per-word timestamps (cannot be used with timestamp_size) */
    word_timestamps?: boolean;
    /** Max segment length in characters (cannot be used with word_timestamps) */
    timestamp_size?: number;
    /** Source language code, e.g. 'en', 'fr' */
    language?: string;
  }

  export interface ShellOptions {
    /** Working directory for the whisper.cpp binary */
    cwd?: string;
  }

  export interface WhisperTranscriptSegment {
    start: string;
    end: string;
    speech: string;
  }

  export interface WhisperNodeOptions {
    modelName?: ModelName;
    modelPath?: string;
    whisperOptions?: WhisperOptions;
    shellOptions?: ShellOptions;
  }

  /**
   * Transcribe a WAV audio file using whisper.cpp.
   * @param filePath Absolute or relative path to the .wav file
   * @param options  Optional model & transcription settings
   * @returns Array of transcript segments { start, end, speech }
   */
  export function whisper(
    filePath: string,
    options?: WhisperNodeOptions,
  ): Promise<WhisperTranscriptSegment[] | undefined>;

  export default whisper;
}
