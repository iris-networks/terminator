#!/usr/bin/env node

import { MCPToolRegistry } from './src/services/MCPToolRegistry.js';
import { getAllTools } from './src/services/ToolRegistry.js';

async function testMCPIntegration() {
  console.log('🧪 Testing MCP Integration\n');

  try {
    // Test 1: Initialize MCP Registry
    console.log('1️⃣ Initializing MCP Tool Registry...');
    const registry = MCPToolRegistry.getInstance();
    await registry.initialize();
    console.log('✅ MCP Tool Registry initialized\n');

    // Test 2: Check status
    console.log('2️⃣ Checking MCP status...');
    const status = registry.getStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    console.log('');

    // Test 3: Get all tools
    console.log('3️⃣ Getting all available tools...');
    const allTools = await getAllTools();
    const toolNames = Object.keys(allTools);
    console.log(`Found ${toolNames.length} total tools:`);
    
    // Group tools by type
    const basicTools = toolNames.filter(t => !t.startsWith('mcp_') && !t.includes('_'));
    const mcpManagementTools = toolNames.filter(t => t.startsWith('mcp_'));
    const mcpServerTools = toolNames.filter(t => t.includes('_') && !t.startsWith('mcp_') && !t.startsWith('browser_') && !t.startsWith('web_') && !t.startsWith('file_') && !t.startsWith('list_') && !t.startsWith('create_') && !t.startsWith('execute_'));

    console.log(`  - Basic tools: ${basicTools.length}`);
    console.log(`  - MCP Management tools: ${mcpManagementTools.length}`);
    console.log(`  - MCP Server tools: ${mcpServerTools.length}`);
    console.log('');

    // Test 4: Test MCP management tools
    console.log('4️⃣ Testing MCP management tools...');
    
    // Test list servers
    if (allTools.mcp_list_servers) {
      console.log('Testing mcp_list_servers...');
      const serversResult = await allTools.mcp_list_servers.execute({ includeDisabled: true });
      console.log('Servers result:', JSON.stringify(serversResult, null, 2));
    }

    // Test health check
    if (allTools.mcp_health_check) {
      console.log('Testing mcp_health_check...');
      const healthResult = await allTools.mcp_health_check.execute({});
      console.log('Health result:', JSON.stringify(healthResult, null, 2));
    }

    // Test list tools
    if (allTools.mcp_list_tools) {
      console.log('Testing mcp_list_tools...');
      const toolsResult = await allTools.mcp_list_tools.execute({});
      console.log('Tools result:', JSON.stringify(toolsResult, null, 2));
    }

    console.log('\n✅ MCP Integration test completed successfully!');

  } catch (error) {
    console.error('❌ MCP Integration test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testMCPIntegration().then(() => {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});