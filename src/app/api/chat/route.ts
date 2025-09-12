import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import { models } from '@/lib/models';
import { listFilesTool } from '@/lib/tools/file-management';
import { webSearchTool } from '@/lib/tools/web-search';

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
    enableFileManagement,
  }: { 
    messages: UIMessage[];
    model: string;
    webSearch: boolean;
    enableFileManagement: boolean;
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

  const result = streamText({
    model: aiModel,
    messages: convertToModelMessages(messages),
    system:
      'You are a helpful assistant that can answer questions and help with tasks',
    tools: {
      ...(webSearch && { webSearch: webSearchTool }),
      ...(enableFileManagement && { listFiles: listFilesTool }),
    },
    stopWhen: stepCountIs(5),
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}