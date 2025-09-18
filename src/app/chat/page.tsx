'use client';

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
  PromptInputButton,
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
import { GlobeIcon, RefreshCcwIcon, CopyIcon, FileTextIcon } from 'lucide-react';
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

import { models } from '@/lib/models';

// Removed unused ToolUIPart type definitions

interface ToolInfo {
  name: string;
  description: string;
}

const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [enableFileManagement, setEnableFileManagement] = useState(false);
  const [availableTools, setAvailableTools] = useState<ToolInfo[]>([]); // New state for available tools
  const { messages, sendMessage, status, regenerate } = useChat();

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/tools');
        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }
        const data: ToolInfo[] = await response.json();
        setAvailableTools(data);
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
          webSearch: webSearch,
          enableFileManagement: enableFileManagement,
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
                                    webSearch: webSearch,
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
            {status === 'submitted' && <Loader />}
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
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputButton
                variant={enableFileManagement ? 'default' : 'ghost'}
                onClick={() => setEnableFileManagement(!enableFileManagement)}
              >
                <FileTextIcon size={16} />
                <span>Files</span>
              </PromptInputButton>

              {/* New Dropdown for Available Tools */}
              {availableTools.length > 0 && (
                <div className="ml-2"> {/* Wrap in a div and apply margin here */}
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger className="flex items-center justify-center w-full">
                      <span>Tools ({availableTools.length})</span>
                    </PromptInputActionMenuTrigger>
                    <PromptInputActionMenuContent>
                      <div className="p-2 w-64"> {/* Added w-64 for wider dropdown content */}
                        <h4 className="text-sm font-semibold mb-1">Available Tools:</h4>
                        <ul className="list-disc list-inside text-xs">
                          {availableTools.map((tool) => (
                            <li key={tool.name}>
                              <strong>{tool.name}</strong>: {tool.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                </div>
              )}

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
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatBotDemo;