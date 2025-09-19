import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronRight } from "lucide-react";
import {
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
} from "./prompt-input";
import React from "react";

interface ToolInfo {
  name: string;
  description: string;
}

export interface StructuredToolInfo {
  defaultTools: ToolInfo[];
  mcpServersTools: Record<string, ToolInfo[]>;
}

interface ToolSelectionProps {
  structuredTools: StructuredToolInfo;
  toolStates: Record<string, boolean>;
  setToolStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ToolSelection: React.FC<ToolSelectionProps> = ({
  structuredTools,
  toolStates,
  setToolStates,
}) => {
  return (
    <>
      {(structuredTools.defaultTools.length > 0 ||
        Object.keys(structuredTools.mcpServersTools).length > 0) && (
        <div className="ml-2">
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger className="flex items-center justify-center w-full">
              <span>
                Tools (
                {Object.values(toolStates).filter(Boolean).length}/
                {structuredTools.defaultTools.length +
                  Object.values(structuredTools.mcpServersTools).flat().length}
                )
              </span>
            </PromptInputActionMenuTrigger>
            <PromptInputActionMenuContent>
              <div className="p-2 w-64 overflow-hidden">
                {structuredTools.defaultTools.length > 0 && (
                  <>
                    <DropdownMenuLabel>Default Tools:</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={structuredTools.defaultTools.every(
                        (tool) => toolStates[tool.name],
                      )}
                      onCheckedChange={(checked) => {
                        setToolStates((prev) => {
                          const newState = { ...prev };
                          structuredTools.defaultTools.forEach((tool) => {
                            newState[tool.name] = checked;
                          });
                          return newState;
                        });
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      Select All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={structuredTools.defaultTools.every(
                        (tool) => !toolStates[tool.name],
                      )}
                      onCheckedChange={(checked) => {
                        setToolStates((prev) => {
                          const newState = { ...prev };
                          structuredTools.defaultTools.forEach((tool) => {
                            newState[tool.name] = !checked;
                          });
                          return newState;
                        });
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      Deselect All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {structuredTools.defaultTools.map((tool) => (
                      <TooltipProvider key={tool.name}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuCheckboxItem
                              checked={toolStates[tool.name] || false}
                              onCheckedChange={(checked) =>
                                setToolStates((prev) => ({
                                  ...prev,
                                  [tool.name]: checked,
                                }))
                              }
                              className={toolStates[tool.name] ? "bg-accent" : ""}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {tool.name}
                            </DropdownMenuCheckboxItem>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{tool.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </>
                )}

                {structuredTools.defaultTools.length > 0 &&
                  Object.keys(structuredTools.mcpServersTools).length > 0 && (
                    <DropdownMenuSeparator />
                  )}

                {Object.keys(structuredTools.mcpServersTools).map((serverId) => (
                  <PromptInputActionMenu key={serverId}>
                    <PromptInputActionMenuTrigger className="flex items-center justify-between w-full text-sm font-bold mb-1 mt-2">
                      <span>{serverId} Tools</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </PromptInputActionMenuTrigger>
                    <PromptInputActionMenuContent side="right" align="start">
                      <div className="p-2 w-64 max-h-80 overflow-x-hidden overflow-y-auto">
                        <DropdownMenuLabel>{serverId} Tools:</DropdownMenuLabel>
                        <DropdownMenuCheckboxItem
                          checked={structuredTools.mcpServersTools[serverId].every(
                            (tool) => toolStates[tool.name],
                          )}
                          onCheckedChange={(checked) => {
                            setToolStates((prev) => {
                              const newState = { ...prev };
                              structuredTools.mcpServersTools[serverId].forEach((tool) => {
                                newState[tool.name] = checked;
                              });
                              return newState;
                            });
                          }}
                          onSelect={(e) => e.preventDefault()}
                        >
                          Select All
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={structuredTools.mcpServersTools[serverId].every(
                            (tool) => !toolStates[tool.name],
                          )}
                          onCheckedChange={(checked) => {
                            setToolStates((prev) => {
                              const newState = { ...prev };
                              structuredTools.mcpServersTools[serverId].forEach((tool) => {
                                newState[tool.name] = !checked;
                              });
                              return newState;
                            });
                          }}
                          onSelect={(e) => e.preventDefault()}
                        >
                          Deselect All
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        {structuredTools.mcpServersTools[serverId].map((tool) => (
                          <TooltipProvider key={tool.name}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuCheckboxItem
                                  checked={toolStates[tool.name] || false}
                                  onCheckedChange={(checked) =>
                                    setToolStates((prev) => ({
                                      ...prev,
                                      [tool.name]: checked,
                                    }))
                                  }
                                  className={toolStates[tool.name] ? "bg-accent" : ""}
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {tool.name}
                                </DropdownMenuCheckboxItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{tool.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                ))}
              </div>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </div>
      )}
    </>
  );
};
