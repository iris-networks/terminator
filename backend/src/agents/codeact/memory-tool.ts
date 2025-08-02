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
import { tool } from 'ai';
import { z } from 'zod';
import { ensureCodeActWorkspace, CODEACT_WORKSPACE } from './utils.js';
import { CodeActMemory } from './memory.js';

export const codeActMemoryTool = tool({
  description: 'Manage persistent memory for CodeAct sessions',
  parameters: z.object({
    action: z.enum(['get', 'set', 'delete', 'clear', 'list', 'has']).describe('Memory operation to perform'),
    key: z.string().optional().describe('Memory key (required for get, set, delete, has)'),
    value: z.any().optional().describe('Value to store (required for set)'),
  }),
  execute: async ({ action, key, value }) => {
    console.log(`🧠 Memory operation: ${action}`);
    
    try {
      await ensureCodeActWorkspace();
      const memory = new CodeActMemory(CODEACT_WORKSPACE);
      
      switch (action) {
        case 'get':
          if (!key) throw new Error('Key is required for get operation');
          const getValue = await memory.get(key);
          return {
            action: 'get',
            key,
            value: getValue,
            found: getValue !== undefined,
            timestamp: new Date().toISOString()
          };
          
        case 'set':
          if (!key) throw new Error('Key is required for set operation');
          if (value === undefined) throw new Error('Value is required for set operation');
          await memory.set(key, value);
          return {
            action: 'set',
            key,
            value,
            success: true,
            timestamp: new Date().toISOString()
          };
          
        case 'delete':
          if (!key) throw new Error('Key is required for delete operation');
          await memory.delete(key);
          return {
            action: 'delete',
            key,
            success: true,
            timestamp: new Date().toISOString()
          };
          
        case 'clear':
          await memory.clear();
          return {
            action: 'clear',
            success: true,
            timestamp: new Date().toISOString()
          };
          
        case 'list':
          const keys = await memory.keys();
          return {
            action: 'list',
            keys,
            count: keys.length,
            timestamp: new Date().toISOString()
          };
          
        case 'has':
          if (!key) throw new Error('Key is required for has operation');
          const exists = await memory.has(key);
          return {
            action: 'has',
            key,
            exists,
            timestamp: new Date().toISOString()
          };
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
    } catch (error) {
      console.error('Memory operation error:', error);
      return {
        action,
        key,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  },
});