import { db } from '@/db';
import { chatsTable, messagesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await params;

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Start a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Delete messages associated with the chat
      await tx.delete(messagesTable).where(eq(messagesTable.chatId, chatId));

      // Then delete the chat itself
      const result = await tx.delete(chatsTable).where(eq(chatsTable.id, chatId)).returning();

      if (result.length === 0) {
        // If chat was not found, rollback the transaction (though in this case, no messages would have been deleted either)
        tx.rollback();
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
    });

    return NextResponse.json({ message: 'Chat deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
