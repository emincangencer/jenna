import { NextResponse } from 'next/server';
import { experimental_createMCPClient, experimental_MCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const defaultTools = [
  { name: 'webSearch', description: 'Search the web for information.' },
  { name: 'listFiles', description: 'List files and directories.' },
  { name: 'readFile', description: 'Read the content of a file.' },
  { name: 'writeFile', description: 'Write content to a file.' },
  { name: 'editFile', description: 'Edit the content of a file.' },
  { name: 'runShellCommand', description: 'Execute a shell command.' },
];

const mcpServersTools: Record<string, { name: string; description: string }[]> = {};
const mcpClients: experimental_MCPClient[] = [];

interface MCPTransportConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  transportType: 'stdio' | 'http' | 'sse';
  id?: string;
}

interface Settings {
  mcpServers?: Record<string, MCPTransportConfig>;
}

async function initializeMcpClients() {
  // Fetch settings to get MCP server configurations
  let settings: Settings = {};
  try {
    const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings`);
    if (!settingsResponse.ok) {
      throw new Error(`Failed to fetch settings: ${settingsResponse.statusText}`);
    }
    settings = await settingsResponse.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Proceed with empty settings if fetching fails
  }

  if (settings.mcpServers && typeof settings.mcpServers === 'object' && settings.mcpServers !== null) {
    for (const serverId in settings.mcpServers) {
      const serverConfig = settings.mcpServers[serverId];
      try {
        let transport;
        switch (serverConfig.transportType) {
          case 'stdio':
            if (serverConfig.command && Array.isArray(serverConfig.args)) {
              transport = new Experimental_StdioMCPTransport({
                command: serverConfig.command,
                args: serverConfig.args,
                env: serverConfig.env,
              });
            } else {
              console.warn(`Invalid stdio server config: ${JSON.stringify(serverConfig)}`);
              continue;
            }
            break;
          case 'http':
            if (serverConfig.url) {
              transport = new StreamableHTTPClientTransport(new URL(serverConfig.url));
            } else {
              console.warn(`Invalid http server config: ${JSON.stringify(serverConfig)}`);
              continue;
            }
            break;
          case 'sse':
            if (serverConfig.url) {
              transport = new SSEClientTransport(new URL(serverConfig.url));
            } else {
              console.warn(`Invalid sse server config: ${JSON.stringify(serverConfig)}`);
              continue;
            }
            break;
          default:
            console.warn(`Unknown MCP server type: ${serverConfig.transportType}`);
            continue;
        }

        const client = await experimental_createMCPClient({ transport });
        mcpClients.push(client);
        const tools = await client.tools();
        mcpServersTools[serverId] = []; // Initialize array for this server
        for (const toolName in tools) {
          mcpServersTools[serverId].push({ name: toolName, description: tools[toolName].description || 'No description provided.' });
        }
      } catch (e) {
        console.error(`Failed to initialize MCP client for server ${serverConfig.id}:`, e);
      }
    }
  }
}

// Initialize clients once when the module is loaded
initializeMcpClients();

export async function GET() {
  return NextResponse.json({ defaultTools, mcpServersTools });
}
