import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

export const listFilesTool = tool({
  description: 'List files and directories in a given path. Defaults to the project root if no path is provided.',
  inputSchema: z.object({
    pathToList: z.string().optional().describe('The path to list files from. Defaults to the project root.'),
  }),
  execute: async ({ pathToList }) => {
    const targetPath = pathToList || process.cwd();

    try {
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      return entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
      }));
    } catch (error: any) {
      return { error: error.message };
    }
  },
});
