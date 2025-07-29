import { promises as fs } from 'fs';
import path from 'path';

// Memory storage for persistent state between executions
export class CodeActMemory {
  private memoryPath: string;
  private memory: Record<string, any> = {};
  
  constructor(workspace: string) {
    this.memoryPath = path.join(workspace, '.code_act_memory.json');
    this.loadMemory();
  }
  
  private async loadMemory() {
    try {
      const data = await fs.readFile(this.memoryPath, 'utf-8');
      this.memory = JSON.parse(data);
    } catch (error) {
      // Memory file doesn't exist or is corrupted, start fresh
      this.memory = {};
    }
  }
  
  private async saveMemory() {
    try {
      await fs.writeFile(this.memoryPath, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.error('Failed to save CodeAct memory:', error);
    }
  }
  
  async get(key: string): Promise<any> {
    return this.memory[key];
  }
  
  async set(key: string, value: any): Promise<void> {
    this.memory[key] = value;
    await this.saveMemory();
  }
  
  async has(key: string): Promise<boolean> {
    return key in this.memory;
  }
  
  async delete(key: string): Promise<void> {
    delete this.memory[key];
    await this.saveMemory();
  }
  
  async clear(): Promise<void> {
    this.memory = {};
    await this.saveMemory();
  }
  
  async keys(): Promise<string[]> {
    return Object.keys(this.memory);
  }
  
  async getAll(): Promise<Record<string, any>> {
    return { ...this.memory };
  }
}