"use client"

import * as React from "react"
import Link from "next/link"

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

export function ChatSidebar() {
  return (
    <Sidebar>
        <SidebarHeader className="mt-16">
          <SidebarInput placeholder="Search chats..." />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {/* Placeholder for chat list */}
              {Array.from({ length: 10 }).map((_, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton asChild>
                    <Link href={`/chat/${i}`}>
                      Chat {i + 1}
                    </Link>
                  </SidebarMenuButton>
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
