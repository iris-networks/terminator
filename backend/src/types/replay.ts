export interface ReplayEvent {
  id: string;
  timestamp: number;
  type: 'user_message' | 'assistant_message' | 'tool_call' | 'tool_result' | 
        'assistant_thinking' | 'message_chunk' | 'session_start' | 'session_end';
  sessionId: string;
  data: any;
}

export interface SessionReplayData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: ReplayEvent[];
  metadata: {
    agentType?: string;
    totalMessages: number;
    totalToolCalls: number;
    workingDirectory?: string;
  };
}

export interface ReplayState {
  isReplaying: boolean;
  currentEventIndex: number;
  playbackSpeed: number;
  isPaused: boolean;
  events: ReplayEvent[];
}