'use client';

import { useParams } from "next/navigation";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
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
import {
  Actions,
  Action
} from '@/components/ai-elements/actions';
import { useState, Fragment, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { RefreshCcwIcon, CopyIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { Loader } from '@/components/ai-elements/loader';




import { type ToolUIPart } from 'ai';

import { ToolSelection, StructuredToolInfo } from '@/components/ai-elements/tool-selection';
import { models } from '@/lib/models';

interface DbMessage {
  id: number;
  chatId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: 'text'; text: string }>;
}



const ChatPage = () => {
  const params = useParams();
  const chatId = params.chatId as string;

  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [toolStates, setToolStates] = useState<Record<string, boolean>>({});
  const [structuredTools, setStructuredTools] = useState<StructuredToolInfo>({ defaultTools: [], mcpServersTools: {} });
  const [isInitialMessageSent, setIsInitialMessageSent] = useState(false);

  const { messages, setMessages, sendMessage, status, regenerate } = useChat({
    id: chatId,
  });

  useEffect(() => {
    const storedMessage = sessionStorage.getItem('initialChatMessage');
    if (storedMessage && !isInitialMessageSent) {
      // Send the message to the AI (this will automatically update the messages state via useChat)
      sendMessage(
        {
          text: storedMessage,
        },
        {
          body: {
            model: model,
            webSearch: toolStates['webSearch'] || false,
            enableListFiles: toolStates['listFiles'] || false,
            enableReadFile: toolStates['readFile'] || false,
            enableWriteFile: toolStates['writeFile'] || false,
            enableEditFile: toolStates['editFile'] || false,
            enableRunCommand: toolStates['runShellCommand'] || false,
            toolStates: toolStates,
            chatId: chatId,
          },
        },
      );

      sessionStorage.removeItem('initialChatMessage'); // Clean up
      setIsInitialMessageSent(true);
    }
  }, [sendMessage, model, toolStates, chatId, isInitialMessageSent]);

  useEffect(() => {
    const fetchInitialMessages = async () => {
      if (messages.length > 0) {
        return;
      }

      try {
        const response = await fetch(`/api/chat/${chatId}/messages`);
        if (!response.ok) {
          throw new Error('Failed to fetch initial messages');
        }
        const data: DbMessage[] = await response.json();
        const formattedMessages: ChatMessage[] = data.map((msg: DbMessage) => ({
          id: msg.id.toString(),
          role: msg.role,
          parts: [{ type: 'text', text: msg.content }],
        }));
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching initial messages:', error);
      }
    };

    if (chatId) {
      fetchInitialMessages();
    }
  }, [chatId, setMessages, messages.length]);

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

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files
      },
      {
        body: {
          model: model,
          webSearch: toolStates['webSearch'] || false,
          enableListFiles: toolStates['listFiles'] || false,
          enableReadFile: toolStates['readFile'] || false,
          enableWriteFile: toolStates['writeFile'] || false,
          enableEditFile: toolStates['editFile'] || false,
          enableRunCommand: toolStates['runShellCommand'] || false,
          toolStates: toolStates,
          chatId: chatId,
        },
      },
    );
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent variant={message.role === 'assistant' ? 'fullWidth' : 'contained'}>
                              <Response>
                                {part.text}
                              </Response>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' && i === messages.length - 1 && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate({
                                  body: {
                                    model: model,
                                    ...toolStates,
                                  },
                                })}
                                label="Retry"
                                tooltip="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                                tooltip="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                        </Fragment>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    case 'dynamic-tool': // Handle dynamic-tool specifically
                    case part.type.startsWith('tool-') ? part.type : 'never': // Keep existing tool- prefix handling
                      {
                        // Define a generic ToolUIPart type that satisfies the UITools constraint
                        type AnyToolUIPart = ToolUIPart<Record<string, { input: unknown; output: unknown }>>;
                        const genericTool = part as AnyToolUIPart; // Cast to the generic ToolUIPart
                        // Extract tool name: try to get it from genericTool.toolName or genericTool.name, otherwise use part.type
                        const toolName = (typeof genericTool === 'object' && genericTool !== null && 'toolName' in genericTool && typeof (genericTool as { toolName: unknown }).toolName === 'string')
                          ? (genericTool as { toolName: string }).toolName
                          : (typeof genericTool === 'object' && genericTool !== null && 'name' in genericTool && typeof (genericTool as { name: unknown }).name === 'string')
                            ? (genericTool as { name: string }).name
                            : part.type.replace('tool-', '');

                        return (
                          <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                            <ToolHeader type={`tool-${toolName}` as `tool-${string}`} state={genericTool.state} />
                            <ToolContent>
                              <ToolInput input={genericTool.input as Record<string, unknown>} />
                              <ToolOutput
                                output={genericTool.output as Record<string, unknown>}
                                errorText={genericTool.errorText}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {(status === 'submitted') && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

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
            <PromptInputSubmit disabled={!input || status === 'submitted'} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatPage;