export interface ToolResultData {
  messageId: string;
  toolName: string;
  toolInput: any;
  toolResult: any;
  status: 'success' | 'error';
  timestamp: string;
  fullJson: string;
  content?: any[];
}

export interface PlaybackState {
  currentFrame: number;
  isPlaying: boolean;
  playbackSpeed: number;
}