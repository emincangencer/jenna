"use client"

import { ChatSidebar } from "@/components/chat/chat-sidebar"

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-grow h-screen">
      <ChatSidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
