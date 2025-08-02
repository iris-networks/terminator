/*
 * Copyright 2025 hivelogic pvt ltd, singapore
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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