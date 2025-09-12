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
import { useState, Fragment } from 'react';
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

type WebSearchToolInput = {
  query: string;
};

type WebSearchToolOutput = Array<{
  content: string;
  link: string;
  title: string;
}>;

type WebSearchToolUIPart = ToolUIPart<{
  webSearch: {
    input: WebSearchToolInput;
    output: WebSearchToolOutput;
  };
}>;

type ListFilesToolInput = {
  pathToList?: string;
};

type ListFilesToolOutput = Array<{
  name: string;
  type: 'directory' | 'file';
}> | { error: string };

type ListFilesToolUIPart = ToolUIPart<{
  listFiles: {
    input: ListFilesToolInput;
    output: ListFilesToolOutput;
  };
}>;

type ReadFileToolInput = {
  filePath: string;
};

type ReadFileToolOutput = {
  content: string;
} | { error: string };

type ReadFileToolUIPart = ToolUIPart<{
  readFile: {
    input: ReadFileToolInput;
    output: ReadFileToolOutput;
  };
}>;

type WriteFileToolInput = {
  filePath: string;
  content: string;
};

type WriteFileToolOutput = {
  success: boolean;
  message: string;
} | { error: string };

type WriteFileToolUIPart = ToolUIPart<{
  writeFile: {
    input: WriteFileToolInput;
    output: WriteFileToolOutput;
  };
}>;

type EditFileToolInput = {
  filePath: string;
  oldString: string;
  newString: string;
};

type EditFileToolOutput = {
  success: boolean;
  message: string;
} | { error: string };

type EditFileToolUIPart = ToolUIPart<{
  editFile: {
    input: EditFileToolInput;
    output: EditFileToolOutput;
  };
}>;

type RunShellCommandToolInput = {
  command: string;
};

type RunShellCommandToolOutput = {
  stdout: string;
  stderr: string;
} | { error: string; stdout: string; stderr: string };

type RunShellCommandToolUIPart = ToolUIPart<{
  runShellCommand: {
    input: RunShellCommandToolInput;
    output: RunShellCommandToolOutput;
  };
}>;

const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [enableFileManagement, setEnableFileManagement] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat();

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
                            <MessageContent>
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
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
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
                    case 'tool-webSearch':
                      {
                        const webSearchTool = part as WebSearchToolUIPart;
                        return (
                          <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                            <ToolHeader type="tool-webSearch" state={webSearchTool.state} />
                            <ToolContent>
                              <ToolInput input={JSON.stringify(webSearchTool.input, null, 2)} />
                              <ToolOutput
                                output={JSON.stringify(webSearchTool.output, null, 2)}
                                errorText={webSearchTool.errorText}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }
                    case 'tool-listFiles':
                      {
                        const listFilesTool = part as ListFilesToolUIPart;
                        return (
                          <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                            <ToolHeader type="tool-listFiles" state={listFilesTool.state} />
                            <ToolContent>
                              <ToolInput input={JSON.stringify(listFilesTool.input, null, 2)} />
                              <ToolOutput
                                output={JSON.stringify(listFilesTool.output, null, 2)}
                                errorText={listFilesTool.errorText}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }
                    case 'tool-readFile':
                      {
                        const readFileTool = part as ReadFileToolUIPart;
                        return (
                          <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                            <ToolHeader type="tool-readFile" state={readFileTool.state} />
                            <ToolContent>
                              <ToolInput input={JSON.stringify(readFileTool.input, null, 2)} />
                              <ToolOutput
                                output={JSON.stringify(readFileTool.output, null, 2)}
                                errorText={readFileTool.errorText}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }
                    case 'tool-writeFile':
                      {
                        const writeFileTool = part as WriteFileToolUIPart;
                        return (
                          <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                            <ToolHeader type="tool-writeFile" state={writeFileTool.state} />
                            <ToolContent>
                              <ToolInput input={JSON.stringify(writeFileTool.input, null, 2)} />
                              <ToolOutput
                                output={JSON.stringify(writeFileTool.output, null, 2)}
                                errorText={writeFileTool.errorText}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }
                    case 'tool-editFile':
                      {
                        const editFileTool = part as EditFileToolUIPart;
                        return (
                          <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                            <ToolHeader type="tool-editFile" state={editFileTool.state} />
                            <ToolContent>
                              <ToolInput input={JSON.stringify(editFileTool.input, null, 2)} />
                              <ToolOutput
                                output={JSON.stringify(editFileTool.output, null, 2)}
                                errorText={editFileTool.errorText}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }
                    case 'tool-runShellCommand':
                      {
                        const runShellCommandTool = part as RunShellCommandToolUIPart;
                        return (
                          <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                            <ToolHeader type="tool-runShellCommand" state={runShellCommandTool.state} />
                            <ToolContent>
                              <ToolInput input={JSON.stringify(runShellCommandTool.input, null, 2)} />
                              <ToolOutput
                                output={JSON.stringify(runShellCommandTool.output, null, 2)}
                                errorText={runShellCommandTool.errorText}
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
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatBotDemo;