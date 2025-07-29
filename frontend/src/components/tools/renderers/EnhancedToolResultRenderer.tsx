'use client';

import React from 'react';
import { CommandResultRenderer } from './CommandResultRenderer';
import { ScriptResultRenderer } from './ScriptResultRenderer';
import { JsonResultRenderer } from './JsonResultRenderer';
import { GenericResultRenderer } from './GenericResultRenderer';
import { WebSearchResultRenderer } from './WebSearchResultRenderer';
import { BrowserResultRenderer } from './BrowserResultRenderer';
import { BrowserControlRenderer } from './BrowserControlRenderer';
import { CodeActRenderer } from './CodeActRenderer';
import { DeepResearchRenderer } from './DeepResearchRenderer';
import {
  FormFillRenderer,
  WaitActionRenderer,
  ClickActionRenderer,
  HoverActionRenderer,
  DragActionRenderer,
  DataExtractionRenderer,
} from './browser';

export interface ToolResultContentPart {
  type: string;
  name?: string;
  toolName?: string;
  toolInput?: any;
  toolResult?: any;
  command?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  script?: string;
  interpreter?: string;
  cwd?: string;
  status?: 'success' | 'error' | 'running';
  timestamp?: string;
  fullJson?: string;
  [key: string]: any;
}

/**
 * Registry of content part renderers
 * Maps content types to their renderer components
 */
const CONTENT_RENDERERS: Record<
  string,
  React.FC<{
    part: ToolResultContentPart;
    onAction?: (action: string, data: any) => void;
  }>
> = {
  command_result: CommandResultRenderer,
  script_result: ScriptResultRenderer,
  shell_execute: CommandResultRenderer,
  python_execute: ScriptResultRenderer,
  node_execute: ScriptResultRenderer,
  bash: CommandResultRenderer,
  python: ScriptResultRenderer,
  json: JsonResultRenderer,
  web_search: WebSearchResultRenderer,
  browser_navigate: BrowserResultRenderer,
  browser_result: BrowserResultRenderer,
  browser_vision_control: BrowserControlRenderer,
  browser_control: BrowserControlRenderer,
  browser_screenshot: BrowserResultRenderer,
  
  // Specialized browser action renderers
  browser_click: ClickActionRenderer,
  browser_double_click: ClickActionRenderer,
  browser_right_click: ClickActionRenderer,
  browser_hover: HoverActionRenderer,
  browser_drag: DragActionRenderer,
  browser_drag_and_drop: DragActionRenderer,
  browser_form_input_fill: FormFillRenderer,
  browser_type: FormFillRenderer,
  browser_wait: WaitActionRenderer,
  browser_extract: DataExtractionRenderer,
  browser_get_text: DataExtractionRenderer,
  browser_get_links: DataExtractionRenderer,
  browser_get_clickable_elements: DataExtractionRenderer,
  
  // Generic fallbacks for simple action names
  click: ClickActionRenderer,
  double_click: ClickActionRenderer,
  right_click: ClickActionRenderer,
  hover: HoverActionRenderer,
  drag: DragActionRenderer,
  drag_and_drop: DragActionRenderer,
  form_fill: FormFillRenderer,
  type: FormFillRenderer,
  wait: WaitActionRenderer,
  extract: DataExtractionRenderer,
  
  // Other renderers
  browser_scroll: BrowserControlRenderer,
  browser_hotkey: BrowserControlRenderer,
  browser_key_press: BrowserControlRenderer,
  scroll: BrowserControlRenderer,
  hotkey: BrowserControlRenderer,
  
  node_codeact: CodeActRenderer,
  python_codeact: CodeActRenderer,
  shell_codeact: CodeActRenderer,
  codeact_memory: CodeActRenderer,
  enhanced_search: DeepResearchRenderer,
  enhanced_visit: DeepResearchRenderer,
  deep_dive: DeepResearchRenderer,
  research_plan: DeepResearchRenderer,
  research_report: DeepResearchRenderer,
  generic: GenericResultRenderer,
};

interface EnhancedToolResultRendererProps {
  /**
   * Array of content parts to render
   */
  content: ToolResultContentPart[];

  /**
   * Optional handler for interactive actions
   */
  onAction?: (action: string, data: any) => void;

  /**
   * Optional className for the container
   */
  className?: string;
}

/**
 * Enhanced tool result renderer that uses specialized renderers based on UI-TARS approach
 */
export const EnhancedToolResultRenderer: React.FC<EnhancedToolResultRendererProps> = ({
  content,
  onAction,
  className = '',
}) => {
  if (!content || content.length === 0) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-sm italic">
        No content to display
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {content.map((part, index) => {
        // Determine renderer based on tool name or type
        let rendererKey = part.type;
        
        if (part.toolName) {
          // Map common tool names to renderer types
          const toolNameMap: Record<string, string> = {
            'execute_command': 'command_result',
            'shell_execute': 'command_result',
            'bash': 'command_result',
            'python_execute': 'script_result',
            'node_execute': 'script_result',
            'script_execute': 'script_result',
            'web_search': 'web_search',
            'browser_navigate': 'browser_navigate',
            'browser_vision_control': 'browser_vision_control',
            'browser_control': 'browser_control',
            'browser_click': 'browser_click',
            'browser_screenshot': 'browser_screenshot',
            'browser_evaluate': 'browser_result',
            'browser_get_markdown': 'browser_result',
            'browser_action': 'browser_control',
            'browser_scroll': 'browser_scroll',
            'browser_drag': 'browser_drag',
            'browser_drag_and_drop': 'browser_drag_and_drop',
            'browser_hotkey': 'browser_hotkey',
            'browser_type': 'browser_type',
            'browser_wait': 'browser_wait',
            'browser_form_input_fill': 'browser_form_input_fill',
            'browser_hover': 'browser_hover',
            'browser_click': 'browser_click',
            'browser_double_click': 'browser_double_click',
            'browser_right_click': 'browser_right_click',
            'browser_key_press': 'browser_key_press',
            'browser_extract': 'browser_extract',
            'browser_get_text': 'browser_get_text',
            'browser_get_links': 'browser_get_links',
            'browser_get_clickable_elements': 'browser_get_clickable_elements',
            'scroll': 'scroll',
            'drag': 'drag',
            'drag_and_drop': 'drag_and_drop',
            'hotkey': 'hotkey',
            'type': 'type',
            'wait': 'wait',
            'click': 'click',
            'double_click': 'double_click',
            'right_click': 'right_click',
            'hover': 'hover',
            'form_fill': 'form_fill',
            'extract': 'extract',
            'node_codeact': 'node_codeact',
            'python_codeact': 'python_codeact', 
            'shell_codeact': 'shell_codeact',
            'codeact_memory': 'codeact_memory',
            'enhanced_search': 'enhanced_search',
            'enhanced_visit_link': 'enhanced_visit',
            'deep_dive': 'deep_dive',
            'research_plan': 'research_plan',
            'report_generator': 'research_report',
          };
          
          rendererKey = toolNameMap[part.toolName] || part.type;
        }

        // Determine if it's a script based on content
        if (part.script || part.interpreter) {
          rendererKey = 'script_result';
        }
        
        // Determine if it's a command based on content
        if (part.command || (part.stdout && !part.script)) {
          rendererKey = 'command_result';
        }

        const Renderer = CONTENT_RENDERERS[rendererKey] || GenericResultRenderer;

        return (
          <div key={`${part.type}-${part.name || part.toolName || ''}-${index}`} className="tool-result-part">
            <Renderer part={part} onAction={onAction} />
          </div>
        );
      })}
    </div>
  );
};

/**
 * Register a custom renderer for a specific content type
 */
export function registerRenderer(
  contentType: string,
  renderer: React.FC<{
    part: ToolResultContentPart;
    onAction?: (action: string, data: any) => void;
  }>,
): void {
  CONTENT_RENDERERS[contentType] = renderer;
}