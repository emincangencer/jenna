import { streamText, UIMessage, convertToModelMessages, stepCountIs, experimental_createMCPClient, experimental_MCPClient } from 'ai';
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import { models } from '@/lib/models';
import { listFilesTool, readFileTool, writeFileTool, editFileTool } from '@/lib/tools/file-management';
import { webSearchTool } from '@/lib/tools/web-search';
import { runShellCommandTool } from '@/lib/tools/shell';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
    enableListFiles,
    enableReadFile,
    enableWriteFile,
    enableEditFile,
    enableRunCommand,
    toolStates,
  }: {
    messages: UIMessage[];
    model: string;
    webSearch: boolean;
    enableListFiles: boolean;
    enableReadFile: boolean;
    enableWriteFile: boolean;
    enableEditFile: boolean;
    enableRunCommand: boolean;
    toolStates: Record<string, boolean>;
  } = await req.json();

  const selectedModel = models.find((m) => m.value === model);

  if (!selectedModel) {
    return new Response('Invalid model selected', { status: 400 });
  }

  let aiModel;
  switch (selectedModel.provider) {
    case 'google':
      aiModel = google(selectedModel.value);
      break;
    case 'openai':
      aiModel = openai(selectedModel.value);
      break;
    case 'groq':
      aiModel = groq(selectedModel.value);
      break;
    default:
      return new Response('Unknown model provider', { status: 400 });
  }

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

interface StreamTextTool {
  execute: (input: unknown) => Promise<unknown>;
  description: string;
  inputSchema: unknown;
}

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

  let mcpTools: Record<string, StreamTextTool> = {};
  const mcpClients: experimental_MCPClient[] = []; // Explicitly type mcpClients

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
                        console.warn(`Unknown MCP server type: ${serverConfig.transportType}`);            continue;
        }

        const client = await experimental_createMCPClient({ transport }); // Await client creation
        mcpClients.push(client);
        const tools = await client.tools();
        mcpTools = { ...mcpTools, ...tools as Record<string, StreamTextTool> };
      } catch (e) {
        console.error(`Failed to initialize MCP client for server ${serverConfig.id}:`, e);
      }
    }
  }

  const result = streamText({
    model: aiModel,
    messages: convertToModelMessages(messages),
    system:
      'You are a helpful assistant that can answer questions and help with tasks',
    tools: {
      ...(webSearch && { webSearch: webSearchTool }),
      ...(enableListFiles && { listFiles: listFilesTool }),
      ...(enableReadFile && { readFile: readFileTool }),
      ...(enableWriteFile && { writeFile: writeFileTool }),
      ...(enableEditFile && { editFile: editFileTool }),
      ...(enableRunCommand && { runShellCommand: runShellCommandTool }),
      ...Object.keys(mcpTools).reduce((acc: Record<string, StreamTextTool>, toolName) => {
        if (toolStates[toolName]) {
          acc[toolName] = mcpTools[toolName];
        }
        return acc;
      }, {} as Record<string, StreamTextTool>),
    },
    stopWhen: stepCountIs(15),
    onFinish: async () => {
      for (const client of mcpClients) {
        await client.close();
      }
    },
    onError: async (error) => {
      console.error('StreamText error:', error);
      for (const client of mcpClients) {
        await client.close();
      }
    },
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}