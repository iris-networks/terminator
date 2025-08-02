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
import { config } from 'dotenv';

config();

type ProviderType = 'anthropic' | 'openai' | 'google' | 'ollama' | 'openrouter';

interface ProviderConfig {
  name: string;
  requiredEnvVars: string[];
  modelExamples: string[];
}

const PROVIDER_CONFIGS: Record<ProviderType, ProviderConfig> = {
  anthropic: {
    name: 'Anthropic Claude',
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    modelExamples: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
  },
  openai: {
    name: 'OpenAI',
    requiredEnvVars: ['OPENAI_API_KEY'],
    modelExamples: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']
  },
  google: {
    name: 'Google Gemini',
    requiredEnvVars: ['GOOGLE_GENERATIVE_AI_API_KEY'],
    modelExamples: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro-002']
  },
  ollama: {
    name: 'Ollama (Local)',
    requiredEnvVars: [], // No API key needed for local Ollama
    modelExamples: ['llama3.1:8b', 'llama3.1:70b', 'codellama', 'mistral']
  },
  openrouter: {
    name: 'OpenRouter',
    requiredEnvVars: ['OPENROUTER_API_KEY'],
    modelExamples: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro-1.5']
  }
};

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigError';
  }
}

export function validateProviderConfig(provider: string, model: string): void {
  // Check if provider is supported
  if (!Object.keys(PROVIDER_CONFIGS).includes(provider)) {
    const supportedProviders = Object.keys(PROVIDER_CONFIGS).join(', ');
    throw new ProviderConfigError(
      `Unsupported AI provider: "${provider}". Supported providers: ${supportedProviders}`
    );
  }

  const providerConfig = PROVIDER_CONFIGS[provider as ProviderType];
  
  // Check required environment variables
  const missingVars = providerConfig.requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    const envVarList = missingVars.join(', ');
    const examples = providerConfig.modelExamples.slice(0, 2).join(' or ');
    
    throw new ProviderConfigError(
      `Missing required environment variables for ${providerConfig.name}: ${envVarList}\n\n` +
      `Please set the following in your .env file:\n` +
      `AI_PROVIDER=${provider}\n` +
      `AI_MODEL=${examples}\n` +
      `${missingVars.map(v => `${v}=your_${v.toLowerCase()}`).join('\n')}`
    );
  }

  // Special validation for Ollama
  if (provider === 'ollama') {
    // Could add Ollama connection check here in the future
    console.log(`Using Ollama with model: ${model}. Make sure Ollama is running locally with "ollama serve"`);
  }

  // Validate model is provided
  if (!model || model.trim() === '') {
    const examples = providerConfig.modelExamples.slice(0, 2).join(' or ');
    throw new ProviderConfigError(
      `AI_MODEL is required for ${providerConfig.name}. Example: AI_MODEL=${examples}`
    );
  }
}

export function getProviderInfo(provider: string): ProviderConfig | null {
  return PROVIDER_CONFIGS[provider as ProviderType] || null;
}

export function listSupportedProviders(): Record<ProviderType, ProviderConfig> {
  return PROVIDER_CONFIGS;
}