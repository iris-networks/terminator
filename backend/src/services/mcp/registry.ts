import { MCPManager } from '../MCPManager.js';
import { MCPConfig, MCPConfigSchema, MCPToolCall } from '../../types/mcp.js';
import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_PATH = process.env.MCP_CONFIG_PATH || path.join(process.cwd(), 'mcp-config.json');

export class MCPToolRegistry {
  private static instance: MCPToolRegistry;
  private mcpManager: MCPManager | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MCPToolRegistry {
    if (!MCPToolRegistry.instance) {
      MCPToolRegistry.instance = new MCPToolRegistry();
    }
    return MCPToolRegistry.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load MCP configuration
      const config = await this.loadConfiguration();
      
      if (!config.enabled) {
        console.log('🔌 MCP tools disabled in configuration');
        this.isInitialized = true;
        return;
      }

      // Initialize MCP Manager
      this.mcpManager = MCPManager.getInstance(config);
      await this.mcpManager.initialize();

      console.log('✅ MCP Tool Registry initialized');
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize MCP Tool Registry:', error);
      // Continue without MCP if initialization fails
      this.isInitialized = true;
    }
  }

  private async loadConfiguration(): Promise<MCPConfig> {
    try {
      const configContent = await fs.readFile(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(configContent);
      
      // Validate configuration
      const validatedConfig = MCPConfigSchema.parse(config);
      console.log('📋 Loaded MCP configuration from:', CONFIG_PATH);
      return validatedConfig;
      
    } catch (error) {
      console.log('📋 No MCP configuration found, using defaults');
      return this.getDefaultConfiguration();
    }
  }

  private getDefaultConfiguration(): MCPConfig {
    return {
      enabled: false,
      servers: {},
      globalConfig: {
        timeout: 30000,
        retries: 3
      }
    };
  }

  async saveConfiguration(config: MCPConfig): Promise<void> {
    try {
      // Validate configuration before saving
      const validatedConfig = MCPConfigSchema.parse(config);
      
      await fs.writeFile(
        CONFIG_PATH, 
        JSON.stringify(validatedConfig, null, 2),
        'utf-8'
      );
      
      console.log('💾 MCP configuration saved to:', CONFIG_PATH);
      
      // Reinitialize if configuration changed
      if (this.isInitialized) {
        this.isInitialized = false;
        await this.initialize();
      }
      
    } catch (error) {
      console.error('❌ Failed to save MCP configuration:', error);
      throw error;
    }
  }

  getMCPTools(): Record<string, any> {
    if (!this.mcpManager || !this.isInitialized) {
      return {};
    }
    
    return this.mcpManager.getAllTools();
  }

  async executeMCPTool(toolCall: MCPToolCall) {
    if (!this.mcpManager) {
      throw new Error('MCP Manager not initialized');
    }
    
    try {
      const result = await this.mcpManager.executeTool(toolCall);
      return result;
    } catch (error) {
      console.error('❌ MCP tool execution failed:', error);
      throw error;
    }
  }

  getMCPManager(): MCPManager | null {
    return this.mcpManager;
  }

  isReady(): boolean {
    return this.isInitialized && this.mcpManager !== null;
  }

  async shutdown(): Promise<void> {
    if (this.mcpManager) {
      await this.mcpManager.shutdown();
      this.mcpManager = null;
    }
    this.isInitialized = false;
  }
}