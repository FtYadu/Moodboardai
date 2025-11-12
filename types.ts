export enum View {
  MOODBOARD = 'moodboard',
  IMAGE_GENERATE = 'image_generate',
  IMAGE_EDIT = 'image_edit',
  VIDEO_GENERATE = 'video_generate',
  ANALYZE = 'analyze',
  CHAT = 'chat',
}

export enum Layout {
  GRID = 'grid',
  FREEFORM = 'freeform',
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'text';
  src: string; // for image/video, this is a URL; for text, this is the content
  prompt?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// FIX: Define AIStudio interface to resolve type conflict
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Augment the Window interface for aistudio used in VideoGenerator
declare global {
  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
