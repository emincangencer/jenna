import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatsTable } from '@/db/schema';

export async function GET() {
  try {
    const chats = await db.select().from(chatsTable);
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}
