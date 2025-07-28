import { tool } from 'ai';
import { z } from 'zod';
import { getAllTools } from '../services/ToolRegistry.js';

// Agent definitions
export enum AgentType {
  MULTI_AGENT = 'multi_agent'
}

interface AgentCapability {
  type: AgentType;
  name: string;
  description: string;
  tools: string[];
  specializations: string[];
  useCases: string[];
}

// Define agent capabilities
export const AGENT_CAPABILITIES: Record<AgentType, AgentCapability> = {
  [AgentType.MULTI_AGENT]: {
    type: AgentType.MULTI_AGENT,
    name: 'AI Assistant',
    description: 'Comprehensive AI assistant with all available tools and capabilities',
    tools: [], // Gets all tools dynamically
    specializations: ['general_assistance', 'code_execution', 'research', 'web_automation', 'file_management'],
    useCases: [
      'General questions and assistance',
      'Code execution and development',
      'Research and analysis',
      'Web automation and scraping',
      'File management and operations'
    ]
  }
};

// Agent selection logic (simplified to always return multi-agent)
function selectOptimalAgent(task: string, requirements: string[]): AgentType {
  // Always return multi-agent since it's the only option
  return AgentType.MULTI_AGENT;
}

// Get all tools (simplified to single agent)
async function getToolsForAgent(agentType: AgentType): Promise<Record<string, any>> {
  // Get all tools including MCP tools
  return await getAllTools();
}

// Agent selection tool
export const selectAgentTool = tool({
  description: 'Select the optimal agent type for a given task based on requirements',
  parameters: z.object({
    task: z.string().describe('Description of the task to be performed'),
    requirements: z.array(z.string()).optional().default([]).describe('Specific requirements or constraints'),
    preferredAgent: z.enum(['basic', 'codeact', 'deep_research', 'gui', 'multi_agent']).optional().describe('Preferred agent type (overrides automatic selection)')
  }),
  execute: async ({ task, requirements, preferredAgent }) => {
    console.log(`🤖 Selecting agent for task: ${task}`);
    
    const selectedType = preferredAgent || selectOptimalAgent(task, requirements);
    const capability = AGENT_CAPABILITIES[selectedType as AgentType];
    const availableTools = await getToolsForAgent(selectedType as AgentType);
    
    return {
      selectedAgent: selectedType,
      agentInfo: capability,
      availableTools: Object.keys(availableTools),
      reasoning: `Selected ${capability.name} because the task involves: ${capability.specializations.join(', ')}`,
      confidence: preferredAgent ? 1.0 : 0.8,
      timestamp: new Date().toISOString()
    };
  },
});

// List available agents tool
export const listAgentsTool = tool({
  description: 'List all available agents and their capabilities',
  parameters: z.object({
    includeTools: z.boolean().optional().default(false).describe('Include detailed tool lists for each agent')
  }),
  execute: async ({ includeTools }) => {
    const agents = Object.values(AGENT_CAPABILITIES).map(capability => ({
      type: capability.type,
      name: capability.name,
      description: capability.description,
      specializations: capability.specializations,
      useCases: capability.useCases,
      ...(includeTools && { tools: capability.tools })
    }));
    
    return {
      totalAgents: agents.length,
      agents,
      timestamp: new Date().toISOString()
    };
  },
});

// Agent switching tool
export const switchAgentTool = tool({
  description: 'Switch to a different agent type during conversation', 
  parameters: z.object({
    newAgentType: z.enum(['basic', 'codeact', 'deep_research', 'gui', 'multi_agent']).describe('Agent type to switch to'),
    reason: z.string().optional().describe('Reason for switching agents'),
    preserveContext: z.boolean().optional().default(true).describe('Whether to preserve conversation context')
  }),
  execute: async ({ newAgentType, reason, preserveContext }) => {
    console.log(`🔄 Switching to agent: ${newAgentType}`);
    
    const newCapability = AGENT_CAPABILITIES[newAgentType as AgentType];
    const newTools = await getToolsForAgent(newAgentType as AgentType);
    
    return {
      previousAgent: 'current', // Would be tracked in actual implementation
      newAgent: newAgentType,
      agentInfo: newCapability,
      availableTools: Object.keys(newTools),
      reason: reason || `Switched to ${newCapability.name} for specialized capabilities`,
      contextPreserved: preserveContext,
      timestamp: new Date().toISOString()
    };
  },
});

// Multi-agent coordination tool
export const coordinateAgentsTool = tool({
  description: 'Coordinate multiple agents to work on different aspects of a complex task',
  parameters: z.object({
    task: z.string().describe('Overall task description'),
    subtasks: z.array(z.object({
      description: z.string(),
      preferredAgent: z.enum(['basic', 'codeact', 'deep_research', 'gui']).optional(),
      dependencies: z.array(z.string()).optional().default([])
    })).describe('Subtasks to be executed by different agents'),
    executionMode: z.enum(['sequential', 'parallel', 'dependency']).optional().default('dependency').describe('How to execute subtasks')
  }),
  execute: async ({ task, subtasks, executionMode }) => {
    console.log(`👥 Coordinating agents for: ${task}`);
    
    const coordinationPlan = {
      id: `coord_${Date.now()}`,
      task,
      executionMode,
      agents: [] as any[],
      executionOrder: [] as string[],
      estimatedTime: 0
    };
    
    // Assign agents to subtasks
    for (const [index, subtask] of subtasks.entries()) {
      const agentType = subtask.preferredAgent || selectOptimalAgent(subtask.description, []);
      const capability = AGENT_CAPABILITIES[agentType as AgentType];
      
      const agentAssignment = {
        subtaskIndex: index,
        subtask: subtask.description,
        assignedAgent: agentType,
        agentCapabilities: capability,
        dependencies: subtask.dependencies,
        estimatedDuration: 5 // minutes, would be calculated based on complexity
      };
      
      coordinationPlan.agents.push(agentAssignment);
      coordinationPlan.estimatedTime += agentAssignment.estimatedDuration;
    }
    
    // Determine execution order based on dependencies
    if (executionMode === 'sequential') {
      coordinationPlan.executionOrder = coordinationPlan.agents.map((_, i) => i.toString());
    } else if (executionMode === 'parallel') {
      coordinationPlan.executionOrder = ['all_parallel'];
    } else {
      // Dependency-based ordering (simplified topological sort)
      const remaining = new Set(coordinationPlan.agents.map((_, i) => i.toString()));
      const ordered: string[] = [];
      
      while (remaining.size > 0) {
        const ready = Array.from(remaining).filter(index => {
          const agent = coordinationPlan.agents[parseInt(index)];
          return agent.dependencies.every((dep: string) => !remaining.has(dep));
        });
        
        if (ready.length === 0) {
          // Handle circular dependencies by processing remaining sequentially
          ordered.push(...Array.from(remaining));
          break;
        }
        
        ordered.push(...ready);
        ready.forEach(index => remaining.delete(index));
      }
      
      coordinationPlan.executionOrder = ordered;
    }
    
    return {
      success: true,
      coordinationPlan,
      message: `Created coordination plan for ${subtasks.length} subtasks using ${new Set(coordinationPlan.agents.map(a => a.assignedAgent)).size} different agents`,
      nextStep: 'Execute subtasks in the planned order',
      timestamp: new Date().toISOString()
    };
  },
});

// Export all orchestration tools
export const orchestrationTools = {
  select_agent: selectAgentTool,
  list_agents: listAgentsTool,
  switch_agent: switchAgentTool,
  coordinate_agents: coordinateAgentsTool,
};

// Export all available tools
export const ALL_AGENT_TOOLS = {
  orchestration: orchestrationTools,
};

// Default agent tools (all tools + orchestration)
export const defaultAgentTools = async () => {
  const allTools = await getAllTools();
  return {
    ...allTools,
    ...orchestrationTools,
  };
};

// Get tools for specific agent type
export async function getAgentTools(agentType: AgentType) {
  return await getToolsForAgent(agentType);
}