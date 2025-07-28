import { tool } from 'ai';
import { z } from 'zod';
import { tools as basicTools, getAllTools } from '../services/ToolRegistry.js';
import { codeActTools } from './CodeActAgent.js';
import { deepResearchTools } from './DeepResearchAgent.js';
import { guiAgentTools } from './GUIAgent.js';

// Agent definitions
export enum AgentType {
  BASIC = 'basic',
  CODEACT = 'codeact', 
  DEEP_RESEARCH = 'deep_research',
  GUI = 'gui',
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
  [AgentType.BASIC]: {
    type: AgentType.BASIC,
    name: 'Basic Agent',
    description: 'General-purpose agent with web search, file operations, and basic browser automation',
    tools: ['web_search', 'file_read', 'file_write', 'list_files', 'create_directory', 'execute_command', 'browser_action'],
    specializations: ['web_search', 'file_management', 'basic_automation'],
    useCases: [
      'Answer questions with web search',
      'Read and write files',
      'Basic browser automation',
      'Execute simple commands'
    ]
  },
  
  [AgentType.CODEACT]: {
    type: AgentType.CODEACT,
    name: 'CodeAct Agent',
    description: 'Code execution specialist supporting Python, Node.js, and shell scripting',
    tools: ['python_execute', 'node_execute', 'shell_execute', 'file_read', 'file_write', 'list_files'],
    specializations: ['code_execution', 'script_running', 'development_tasks'],
    useCases: [
      'Execute Python scripts with pip dependencies',
      'Run Node.js/JavaScript code with npm packages',
      'Execute shell scripts with multiple interpreters',
      'Code testing and debugging',
      'Data analysis and processing'
    ]
  },
  
  [AgentType.DEEP_RESEARCH]: {
    type: AgentType.DEEP_RESEARCH,
    name: 'Deep Research Agent',
    description: 'Advanced research specialist with comprehensive investigation capabilities',
    tools: ['create_research_plan', 'execute_research_plan', 'generate_research_report', 'list_research_plans', 'web_search'],
    specializations: ['research_planning', 'content_analysis', 'report_generation'],
    useCases: [
      'Comprehensive topic research',
      'Multi-source investigation',
      'Generate detailed research reports',
      'Academic and business research',
      'Market analysis and trends'
    ]
  },
  
  [AgentType.GUI]: {
    type: AgentType.GUI,
    name: 'GUI Agent',  
    description: 'Visual browser automation with screenshot-based interaction',
    tools: ['visual_navigate', 'visual_click', 'visual_type', 'visual_analyze', 'close_browser_session', 'list_browser_sessions'],
    specializations: ['visual_automation', 'gui_interaction', 'web_scraping'],
    useCases: [
      'Visual web automation',
      'Screenshot-based interaction',
      'Complex web scraping',
      'GUI testing and validation',
      'Visual element analysis'
    ]
  },
  
  [AgentType.MULTI_AGENT]: {
    type: AgentType.MULTI_AGENT,
    name: 'Multi-Agent Orchestrator',
    description: 'Coordinates multiple agents for complex multi-step tasks',
    tools: [], // Gets tools from all agents
    specializations: ['task_orchestration', 'agent_coordination', 'workflow_management'],
    useCases: [
      'Complex multi-step workflows',
      'Cross-domain task execution',
      'Agent coordination and delegation',
      'Advanced automation pipelines'
    ]
  }
};

// Agent selection logic
function selectOptimalAgent(task: string, requirements: string[]): AgentType {
  const taskLower = task.toLowerCase();
  const reqLower = requirements.map(r => r.toLowerCase());
  
  // Keywords that indicate specific agent needs
  const codeKeywords = ['python', 'javascript', 'node', 'script', 'execute', 'run code', 'programming', 'debug'];
  const researchKeywords = ['research', 'investigate', 'analyze', 'report', 'study', 'comprehensive', 'detailed analysis'];
  const guiKeywords = ['visual', 'screenshot', 'gui', 'click', 'interact', 'visual automation', 'browser automation'];
  const multiAgentKeywords = ['multiple steps', 'complex workflow', 'coordinate', 'multi-stage', 'pipeline'];
  
  // Check for multi-agent needs first
  if (multiAgentKeywords.some(keyword => taskLower.includes(keyword) || reqLower.some(r => r.includes(keyword)))) {
    return AgentType.MULTI_AGENT;
  }
  
  // Check for specialized agent needs
  if (codeKeywords.some(keyword => taskLower.includes(keyword) || reqLower.some(r => r.includes(keyword)))) {
    return AgentType.CODEACT;
  }
  
  if (researchKeywords.some(keyword => taskLower.includes(keyword) || reqLower.some(r => r.includes(keyword)))) {
    return AgentType.DEEP_RESEARCH;
  }
  
  if (guiKeywords.some(keyword => taskLower.includes(keyword) || reqLower.some(r => r.includes(keyword)))) {
    return AgentType.GUI;
  }
  
  // Default to basic agent
  return AgentType.BASIC;
}

// Get tools for agent type
async function getToolsForAgent(agentType: AgentType): Promise<Record<string, any>> {
  // Get all tools including MCP tools
  const allTools = await getAllTools();
  
  switch (agentType) {
    case AgentType.BASIC:
      return allTools;
    case AgentType.CODEACT:
      return { ...codeActTools, ...allTools };
    case AgentType.DEEP_RESEARCH:
      return { ...deepResearchTools, ...allTools };
    case AgentType.GUI:
      return { ...guiAgentTools, ...allTools };
    case AgentType.MULTI_AGENT:
      return { ...allTools, ...codeActTools, ...deepResearchTools, ...guiAgentTools };
    default:
      return allTools;
  }
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

// Export all available tools grouped by agent
export const ALL_AGENT_TOOLS = {
  orchestration: orchestrationTools,
  basic: basicTools,
  codeact: codeActTools,
  deep_research: deepResearchTools,
  gui: guiAgentTools,
};

// Default agent tools (basic + orchestration)
export const defaultAgentTools = {
  ...basicTools,
  ...orchestrationTools,
};

// Get tools for specific agent type
export async function getAgentTools(agentType: AgentType) {
  return await getToolsForAgent(agentType);
}