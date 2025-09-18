import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && typeof (error as NodeJS.ErrnoException).code === 'string';
}

export async function GET() {
  try {
    const homeDir = os.homedir();
    const configPath = path.join(homeDir, '.config', 'jenna', 'settings.json');
    let settingsContent: string;
    try {
      settingsContent = await fs.readFile(configPath, 'utf-8');
    } catch (readError: unknown) {
      if (isErrnoException(readError) && readError.code === 'ENOENT') {
        // If file not found, create it with an empty JSON object
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, '{}', 'utf-8');
        settingsContent = '{}'; // Set content to empty object for parsing
      } else {
        throw readError; // Re-throw other errors
      }
    }

    const settings = JSON.parse(settingsContent);
    return NextResponse.json(settings);
  } catch (error: unknown) {
    console.error('Error handling settings.json:', error);
    return NextResponse.json({ error: 'Failed to read or create settings' }, { status: 500 });
  }
}