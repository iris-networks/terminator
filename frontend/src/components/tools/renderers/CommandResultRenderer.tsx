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
'use client';

import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';

interface CommandResultRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Custom command highlighting function
 * Modern approach with regex patterns for different command elements
 */
const highlightCommand = (command: string) => {
  const tokenize = (cmd: string) => {
    const parts: React.ReactNode[] = [];

    // Regular expression patterns for command highlighting
    const patterns = [
      // Commands and subcommands (usually the first word)
      {
        pattern: /^[\w.-]+|(?<=\s|;|&&|\|\|)[\w.-]+(?=\s|$)/,
        className: 'text-cyan-400 font-bold',
      },
      // Option flags (-v, --version etc.)
      { pattern: /(?<=\s|^)(-{1,2}[\w-]+)(?=\s|=|$)/, className: 'text-yellow-300' },
      // Paths and files
      {
        pattern: /(?<=\s|=|:|^)\/[\w./\\_-]+|\.\/?[\w./\\_-]+|~\/[\w./\\_-]+/,
        className: 'text-green-400',
      },
      // Quoted strings
      { pattern: /(["'])(?:(?=(\\?))\2.)*?\1/, className: 'text-orange-300' },
      // Environment variables
      { pattern: /\$\w+|\$\{\w+\}/, className: 'text-purple-400' },
      // Output redirection
      { pattern: /(?<=\s)(>|>>|<|<<|2>|2>>|&>)(?=\s|$)/, className: 'text-blue-400 font-bold' },
      // Pipes and operators
      { pattern: /(?<=\s)(\||;|&&|\|\|)(?=\s|$)/, className: 'text-red-400 font-bold' },
    ];

    let remainingCmd = cmd;
    let currentIndex = 0;

    while (remainingCmd) {
      let foundMatch = false;

      for (const { pattern, className } of patterns) {
        const match = remainingCmd.match(pattern);
        if (match && match.index === 0) {
          const value = match[0];
          
          parts.push(
            <span key={`highlight-${currentIndex}`} className={className}>
              {value}
            </span>
          );

          remainingCmd = remainingCmd.slice(value.length);
          currentIndex += value.length;
          foundMatch = true;
          break;
        }
      }

      // If no pattern matches, add a plain character and continue
      if (!foundMatch) {
        parts.push(
          <span key={`char-${currentIndex}`} className="text-gray-200">
            {remainingCmd[0]}
          </span>
        );
        remainingCmd = remainingCmd.slice(1);
        currentIndex += 1;
      }
    }

    return parts;
  };

  const lines = command.split('\n');
  return lines.map((line, index) => (
    <div key={index} className="command-line whitespace-nowrap">
      {tokenize(line)}
    </div>
  ));
};

/**
 * Renders a terminal-like command and output result
 * Modern CommandResultRenderer with macOS-style terminal
 */
export const CommandResultRenderer: React.FC<CommandResultRendererProps> = ({ part }) => {
  const [copied, setCopied] = useState(false);
  
  // Extract command and output from different possible structures
  const command = part.command || part.toolInput?.command || '';
  const stdout = part.stdout || part.toolResult?.stdout || part.toolResult?.output || '';
  const stderr = part.stderr || part.toolResult?.stderr || part.toolResult?.error || '';
  const exitCode = part.exitCode ?? part.toolResult?.exitCode ?? part.toolResult?.exit_code;

  if (!command && !stdout && !stderr) {
    return <div className="text-gray-500 italic">Command result is empty</div>;
  }

  // Exit code styling
  const isError = exitCode !== 0 && exitCode !== undefined;

  const copyToClipboard = async () => {
    const textToCopy = `$ ${command}\n${stdout}${stderr ? `\n${stderr}` : ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-2">
      {/* Terminal interface with macOS-style design */}
      <div className="rounded-lg overflow-hidden border border-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
        {/* Terminal title bar with macOS-style control buttons */}
        <div className="bg-[#111111] px-3 py-1.5 border-b border-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex space-x-1.5 mr-3">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
            </div>
            <div className="text-gray-400 text-xs font-medium">
              Terminal
              {exitCode !== undefined && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                    isError
                      ? 'bg-red-900/30 text-red-400 border border-red-800/50'
                      : 'bg-green-900/30 text-green-400 border border-green-800/50'
                  }`}
                >
                  exit {exitCode}
                </span>
              )}
            </div>
          </div>
          
          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Copy command and output"
          >
            {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
          </button>
        </div>

        {/* Terminal content area */}
        <div className="bg-black px-3 py-2 font-mono text-sm terminal-content overflow-auto max-h-[80vh]">
          <div className="overflow-x-auto min-w-full">
            {/* Command section */}
            {command && (
              <div className="flex items-start whitespace-nowrap">
                <span className="select-none text-green-400 mr-2 font-bold terminal-prompt-symbol">
                  $
                </span>
                <div className="flex-1">{highlightCommand(command)}</div>
              </div>
            )}

            {/* Output section */}
            {stdout && (
              <pre className="whitespace-pre-wrap text-gray-200 mt-2 ml-3 leading-relaxed">
                {stdout}
              </pre>
            )}

            {/* Error output */}
            {stderr && (
              <pre className="whitespace-pre-wrap text-red-400 mt-2 ml-3 leading-relaxed">
                {stderr}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};