'use client';

import { Plus, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function HoverToolbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNewChat = () => {
    router.push('/chat');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Show what the theme will switch TO, not what it currently is
  const getThemeIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />;
    return theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (!mounted) return 'Switch to light mode';
    return theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  };

  return (
    <div className="bg-background/80 pointer-events-auto fixed top-4 left-4 z-[999] flex items-center gap-2 rounded-lg border p-1 shadow-lg backdrop-blur-xs">
      <SidebarTrigger className="pointer-events-auto h-8 w-8 cursor-pointer" />

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="h-8 w-8 cursor-pointer"
        title={getThemeLabel()}
      >
        {getThemeIcon()}
        <span className="sr-only">{getThemeLabel()}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNewChat}
        className="h-8 w-8 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">New Chat</span>
      </Button>
    </div>
  );
}
