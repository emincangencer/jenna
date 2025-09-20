import { tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';

export const runShellCommandTool = tool({
  description: 'Run a shell command and return its output.',
  inputSchema: z.object({
    command: z.string().describe('The shell command to run.'),
  }),
  execute: async ({ command }) => {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject({ error: error.message, stdout, stderr });
          return;
        }
        resolve({ stdout, stderr });
      });
    });
  },
});
