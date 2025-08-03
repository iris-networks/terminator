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
import { spawn } from 'child_process';

// Execute code with timeout and real-time output  
export async function executeCode(
  command: string,
  args: string[],
  workingDir: string,
  timeout: number = 30000
): Promise<{ output: string; error: string; exitCode: number; duration: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';
    let error = '';
    let timedOut = false;
    
    const child = spawn(command, args, {
      cwd: workingDir,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Set up timeout
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);
    
    // Collect output
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code, signal) => {
      clearTimeout(timeoutHandle);
      const duration = Date.now() - startTime;
      const exitCode = timedOut ? -1 : (code || 0);
      
      resolve({
        output: output.trim(),
        error: timedOut ? 'Execution timed out' : error.trim(),
        exitCode,
        duration
      });
    });
    
    child.on('error', (err) => {
      clearTimeout(timeoutHandle);
      resolve({
        output: '',
        error: err.message,
        exitCode: -1,
        duration: Date.now() - startTime
      });
    });
  });
}