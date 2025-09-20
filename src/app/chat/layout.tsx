'use client';

import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { useParams } from 'next/navigation';

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const chatId = params.chatId as string;

  return (
    <div className="flex h-screen flex-grow">
      <ChatSidebar currentChatId={chatId} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
