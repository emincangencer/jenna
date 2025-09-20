'use client';

import { useRouter } from 'next/navigation';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/hooks/use-user';

import { ToolSelection, StructuredToolInfo } from '@/components/ai-elements/tool-selection';
import { models } from '@/lib/models';

const NewChatPage = () => {
  const router = useRouter();

  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [toolStates, setToolStates] = useState<Record<string, boolean>>({});
  const [structuredTools, setStructuredTools] = useState<StructuredToolInfo>({ defaultTools: [], mcpServersTools: {} });
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { status } = useChat({});
  const userId = useUser();

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/tools');
        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }
        const data: StructuredToolInfo = await response.json();
        setStructuredTools(data);

        const initialToolStates: Record<string, boolean> = {};
        data.defaultTools.forEach(tool => {
          initialToolStates[tool.name] = false;
        });
        for (const serverId in data.mcpServersTools) {
          data.mcpServersTools[serverId].forEach(tool => {
            initialToolStates[tool.name] = false;
          });
        }
        setToolStates(initialToolStates);
      } catch (error) {
        console.error('Error fetching available tools:', error);
      }
    };

    fetchTools();
  }, []);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!userId) return; // Prevent submission if userId is not available

    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    const newChatId = uuidv4();
    setIsCreatingChat(true);

    // Store the initial message and metadata in a more robust way
    const chatInitData = {
      message: message.text || 'Sent with attachments',
      files: message.files,
      model: model,
      toolStates: toolStates,
      timestamp: Date.now(), // Add timestamp to handle stale data
      userId: userId, // Add userId here
    };
    
    // Use both sessionStorage and URL params for redundancy
    sessionStorage.setItem(`chat-init-${newChatId}`, JSON.stringify(chatInitData));
    
    // Navigate with the chat ID
    router.push(`/chat/${newChatId}?new=true`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full justify-end">
        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <ToolSelection
                structuredTools={structuredTools}
                toolStates={toolStates}
                setToolStates={setToolStates}
              />

              <div className="ml-2">
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setModel(value);
                  }}
                  value={model}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map((model) => (
                      <PromptInputModelSelectItem key={model.value} value={model.value}>
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </div>
            </PromptInputTools>
            <PromptInputSubmit 
              disabled={!input || status === 'submitted' || isCreatingChat || !userId} 
              status={isCreatingChat ? 'submitted' : status} 
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default NewChatPage;