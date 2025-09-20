"use client"

import * as React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

interface Chat {
  id: number;
  title: string;
}

export function ChatSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch("/api/chat/list");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Chat[] = await response.json();
        setChats(data);
      } catch (e: unknown) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    const handleChatCreated = () => {
      fetchChats();
    };

    window.addEventListener('chatCreated', handleChatCreated);

    return () => {
      window.removeEventListener('chatCreated', handleChatCreated);
    };
  }, []);

  const handleDeleteChat = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  return (
    <Sidebar>
        <SidebarHeader className="mt-16">
          <SidebarInput placeholder="Search chats..." />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {loading && <SidebarMenuItem>Loading chats...</SidebarMenuItem>}
              {error && <SidebarMenuItem className="text-red-500">Error: {error}</SidebarMenuItem>}
              {!loading && chats.length === 0 && <SidebarMenuItem>No chats found.</SidebarMenuItem>}
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id} className="flex justify-between items-center group/item">
                  <SidebarMenuButton asChild>
                    <Link href={`/chat/${chat.id}`} className="flex-grow">
                      {chat.title}
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover/item:opacity-100"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {/* Placeholder for footer content */}
          <p className="text-sm text-center text-gray-500">
            Jenna AI
          </p>
        </SidebarFooter>
      </Sidebar>
  )
}
