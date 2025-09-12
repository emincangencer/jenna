import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';


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
    } catch (error: unknown) {
      return { error: (error as Error).message };
    }
  },
});

export const readFileTool = tool({
  description: 'Read the content of a specified file.',
  inputSchema: z.object({
    filePath: z.string().describe('The path to the file to read.'),
  }),
  execute: async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { content };
    } catch (error: unknown) {
      return { error: (error as Error).message };
    }
  },
});

export const writeFileTool = tool({
  description: 'Write content to a specified file. If the file does not exist, it will be created. If it exists, its content will be overwritten.',
  inputSchema: z.object({
    filePath: z.string().describe('The path to the file to write.'),
    content: z.string().describe('The content to write to the file.'),
  }),
  execute: async ({ filePath, content }) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, message: `File ${filePath} written successfully.` };
    } catch (error: unknown) {
      return { error: (error as Error).message };
    }
  },
});

export const editFileTool = tool({
  description: 'Edit a file by replacing a specified old string with a new string.',
  inputSchema: z.object({
    filePath: z.string().describe('The path to the file to edit.'),
    oldString: z.string().describe('The string to be replaced.'),
    newString: z.string().describe('The new string to replace the old string.'),
  }),
  execute: async ({ filePath, oldString, newString }) => {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      content = content.replace(oldString, newString);
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, message: `File ${filePath} edited successfully.` };
    } catch (error: unknown) {
      return { error: (error as Error).message };
    }
  },
});