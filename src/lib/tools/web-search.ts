import { tool } from 'ai';
import { z } from 'zod';
import Firecrawl from '@mendable/firecrawl-js';
import 'dotenv/config';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

export const webSearchTool = tool({
  description: 'Search the web for up-to-date information',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const results = await firecrawl.search(query, {
      limit: 3,
      scrapeOptions: { formats: ['markdown'] },
    });
    return results;
  },
});
