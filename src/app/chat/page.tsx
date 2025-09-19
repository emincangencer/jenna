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

import { ToolSelection, StructuredToolInfo } from '@/components/ai-elements/tool-selection';
import { models } from '@/lib/models';



const NewChatPage = () => {
  const router = useRouter();

  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [toolStates, setToolStates] = useState<Record<string, boolean>>({});
  const [structuredTools, setStructuredTools] = useState<StructuredToolInfo>({ defaultTools: [], mcpServersTools: {} });
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { status } = useChat({}); // Removed sendMessage and regenerate as they are not used directly here

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
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // Pre-generate chat ID for immediate navigation
    const newChatId = uuidv4();
    setIsCreatingChat(true);

    // Navigate immediately to reduce perceived delay
    sessionStorage.setItem('initialChatMessage', message.text || 'Sent with attachments');
    router.push(`/chat/${newChatId}`);

    // Create the chat in the background
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createChat', // Add this line
          messages: [], // Keep this as empty, as the message will be sent by the chat/[chatId]/page.tsx
          model: model,
          webSearch: toolStates['webSearch'] || false,
          enableListFiles: toolStates['listFiles'] || false,
          enableReadFile: toolStates['readFile'] || false,
          enableWriteFile: toolStates['writeFile'] || false,
          enableEditFile: toolStates['editFile'] || false,
          enableRunCommand: toolStates['runShellCommand'] || false,
          toolStates: toolStates,
          chatId: newChatId, // Pass the pre-generated chat ID
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create new chat: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      // Handle error - perhaps show a notification to the user
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full justify-end"> {/* Added justify-end to push prompt input to bottom */}
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

              <div className="ml-2"> {/* Wrap in a div and apply margin here */}
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
              disabled={!input || status === 'submitted' || isCreatingChat} 
              status={isCreatingChat ? 'submitted' : status} 
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default NewChatPage;