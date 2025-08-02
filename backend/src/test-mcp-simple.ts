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
import { MCPToolRegistry } from './services/MCPToolRegistry.js';

async function testMCPSimple() {
  console.log('🧪 Testing MCP Integration (Simple)\n');

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

    // Test 3: Get MCP tools (should be empty since no servers are enabled)
    console.log('3️⃣ Getting MCP tools...');
    const mcpTools = registry.getMCPTools();
    const toolCount = Object.keys(mcpTools).length;
    console.log(`Found ${toolCount} MCP tools from connected servers`);
    
    if (toolCount > 0) {
      console.log('Available MCP tools:', Object.keys(mcpTools));
    } else {
      console.log('No MCP tools available (expected - no servers are enabled in config)');
    }
    console.log('');

    console.log('✅ Simple MCP Integration test completed successfully!');

  } catch (error) {
    console.error('❌ MCP Integration test failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

// Run the test
testMCPSimple().then(() => {
  console.log('\n🎉 Simple test passed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});