import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import { models } from '@/lib/models';
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
  }: { 
    messages: UIMessage[];
    model: string;
    webSearch: boolean;
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
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}