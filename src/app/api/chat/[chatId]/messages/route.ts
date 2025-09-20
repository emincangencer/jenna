import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { messagesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const chatId = pathSegments[pathSegments.length - 2] || '';

    if (!chatId) {
      return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 });
    }

    const messages = await db.select().from(messagesTable).where(eq(messagesTable.chatId, chatId));
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
