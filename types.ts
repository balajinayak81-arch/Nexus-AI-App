export enum AppMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

export interface GeneratedVideo {
  url: string;
  prompt: string;
  timestamp: number;
}

export interface GeneratedAudio {
  audioBuffer: AudioBuffer;
  prompt: string;
  timestamp: number;
}

// Service Types
export interface VideoGenerationConfig {
  prompt: string;
  resolution: '720p' | '1080p';
  aspectRatio: '16:9' | '9:16';
  image?: {
    data: string; // base64
    mimeType: string;
  };
}

export interface AudioGenerationConfig {
  text: string;
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
}

export interface ImageGenerationConfig {
  prompt: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  baseImage?: {
    data: string;
    mimeType: string;
  };
}
