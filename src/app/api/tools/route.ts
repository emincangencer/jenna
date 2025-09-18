import { NextResponse } from 'next/server';
import { experimental_createMCPClient, experimental_MCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Import existing tools
import { listFilesTool, readFileTool, writeFileTool, editFileTool } from '@/lib/tools/file-management';
import { webSearchTool } from '@/lib/tools/web-search';
import { runShellCommandTool } from '@/lib/tools/shell';

export async function GET() {
  let allTools: Record<string, unknown> = {};
  const mcpClients: experimental_MCPClient[] = [];

  try {
    // Fetch settings to get MCP server configurations
    let settings: any = {};
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

    // Add existing tools
    allTools = {
      webSearch: webSearchTool,
      listFiles: listFilesTool,
      readFile: readFileTool,
      writeFile: writeFileTool,
      editFile: editFileTool,
      runShellCommand: runShellCommandTool,
    };

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
          allTools = { ...allTools, ...tools };
        } catch (e) {
          console.error(`Failed to initialize MCP client for server ${serverConfig.id}:`, e);
        }
      }
    }

    const toolList = Object.keys(allTools).map(key => ({
      name: key,
      description: (typeof allTools[key] === 'object' && allTools[key] !== null && 'description' in allTools[key] && typeof (allTools[key] as { description: unknown }).description === 'string') ? (allTools[key] as { description: string }).description : 'No description available',
    }));

    return NextResponse.json(toolList);
  } catch (error) {
    console.error('Error fetching available tools:', error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  } finally {
    for (const client of mcpClients) {
      await client.close();
    }
  }
}