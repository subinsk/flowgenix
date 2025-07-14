
import { useState } from "react";
import { NodeWrapper } from "@/components";
import { Eye, EyeOff } from "lucide-react";
import type { NodeFieldError } from "@/hooks";
import { Icon as Iconify } from "@iconify/react";
import { CustomHandle } from "./CustomHandle";
import { Position } from "@xyflow/react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Separator, Switch } from "@/components/ui";
import { getDefaultPrompt } from "@/constants/promptTemplates";

type TokenType =
  | { type: "editable"; content: string; key: string }
  | { type: "token"; content: string; key: string; color: string };

interface LLMEngineNodeData {
  validationErrors?: NodeFieldError[];
  inputTypes?: string[];
  hasInput?: boolean;
  inputType?: string;
  webSearchEnabled?: boolean;
  temperature?: number;
  model?: string;
  apiKey?: string;
  serpApiKey?: string;
  systemPrompt?: string;
  config?: Record<string, unknown>;
  onUpdate?: (id: string, update: { data: LLMEngineNodeData }) => void;
  clearValidationError?: (id: string, nodeType: string, field: string) => void;
  onSettings?: () => void;
  onDelete?: () => void;
}

interface LLMEngineNodeProps {
  id: string;
  data: LLMEngineNodeData;
  selected: boolean;
}

export const LLMEngineNode = ({ id, data, selected }: LLMEngineNodeProps) => {
  const nodeErrors: NodeFieldError[] = (data?.validationErrors || []).filter(
    (err: NodeFieldError) => err.nodeId === id && err.nodeType === "llmEngine"
  );
  const modelErrors = nodeErrors.filter((err) => err.field === "model");
  const apiKeyErrors = nodeErrors.filter((err) => err.field === "apiKey");
  const serpKeyErrors = nodeErrors.filter((err) => err.field === "serpApiKey");

  const [showApiKey, setShowApiKey] = useState(false);
  const [showSerpKey, setShowSerpKey] = useState(false);

  const hasContext = data?.inputTypes?.includes("context") || (data?.hasInput && data?.inputType === "context");
  const hasQuery = data?.inputTypes?.includes("query") || (data?.hasInput && data?.inputType === "query");

  const webSearchEnabled = data?.webSearchEnabled || false;
  const temperature = data?.temperature !== undefined ? data.temperature : 0.7;

  const renderTokenizedSystemPrompt = (): TokenType[] => {
    const defaultPrompt = getDefaultPrompt();
    const basePrompt = data?.systemPrompt || defaultPrompt;
    const tokens: TokenType[] = [];

    tokens.push({
      type: "editable",
      content: basePrompt,
      key: "base"
    });

    if (hasQuery) {
      tokens.push({
        type: "token",
        content: "Query Input",
        key: "query",
        color: "text-blue-700"
      });
    }

    if (hasContext) {
      tokens.push({
        type: "token",
        content: "Context Input",
        key: "context",
        color: "text-green-700"
      });
    }

    return tokens;
  };

  const MODEL_NAME_MAP: Record<string, string> = {
    'GPT-4': 'gpt-4',
    'GPT-4 Turbo': 'gpt-4-turbo',
    'GPT-3.5 Turbo': 'gpt-3.5-turbo',
    'Gemini Pro': 'gemini-pro',
    'Gemini 2.0 Flash': 'gemini-2.0-flash',
    'Claude 3': 'claude-3',
  };
  const MODEL_NAME_MAP_REVERSE: Record<string, string> = Object.fromEntries(
    Object.entries(MODEL_NAME_MAP).map(([k, v]) => [v, k])
  );

  return (
    <NodeWrapper
      type="llmEngine"
      selected={selected}
      onSettings={data?.onSettings}
      onDelete={data?.onDelete}
      id={id}
      validationErrors={Array.isArray(data?.validationErrors) ? data.validationErrors.map(e => e.error) : []}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Iconify icon="lucide:sparkles" className="w-5 h-5 text-[#444444]/80" />
        <h3 className="font-semibold text-foreground">LLM Engine</h3>
      </div>
      <div className="bg-[#EDF3FF] px-4 py-1.5 text-sm">
        Run a query with LLM
      </div>
      <div className="p-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Model</label>
            <Select
              value={data?.model && MODEL_NAME_MAP_REVERSE[data.model] ? MODEL_NAME_MAP_REVERSE[data.model] : (data?.model || '')}
              onValueChange={(uiValue) => {
                const backendValue = MODEL_NAME_MAP[uiValue] || uiValue;
                data?.onUpdate?.(id, {
                  data: {
                    ...data,
                    model: backendValue,
                    config: {
                      ...data?.config,
                      model: backendValue
                    }
                  }
                });
                if (uiValue && typeof data?.clearValidationError === 'function') {
                  data.clearValidationError(id, 'llmEngine', 'model');
                }
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={modelErrors.length > 0}
                aria-describedby={modelErrors.length > 0 ? `${id}-llm-model-error` : undefined}
              >
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="GPT-4">GPT-4</SelectItem>
                  <SelectItem value="GPT-4 Turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="GPT-3.5 Turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="Gemini Pro">Gemini Pro</SelectItem>
                  <SelectItem value="Gemini 2.0 Flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="Claude 3">Claude 3</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {modelErrors.length > 0 && (
              <div id={`${id}-llm-model-error`} className="text-xs text-destructive mt-1">
                {modelErrors.map((err, idx) => (
                  <div key={idx}>{err.error}</div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                className={`w-full p-2 pr-8 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent nodrag ${apiKeyErrors.length > 0 ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                placeholder="Enter API key..."
                value={data?.apiKey || ''}
                onChange={e => {
                  data?.onUpdate?.(id, {
                    data: {
                      ...data,
                      apiKey: e.target.value,
                      config: {
                        ...data?.config,
                        apiKey: e.target.value
                      }
                    }
                  });
                  if (e.target.value && typeof data?.clearValidationError === 'function') {
                    data.clearValidationError(id, 'llmEngine', 'apiKey');
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                aria-invalid={apiKeyErrors.length > 0}
                aria-describedby={apiKeyErrors.length > 0 ? `${id}-llm-api-key-error` : undefined}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground nodrag"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowApiKey(!showApiKey);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {apiKeyErrors.length > 0 && (
              <div id={`${id}-llm-api-key-error`} className="text-xs text-destructive mt-1">
                {apiKeyErrors.map((err, idx) => (
                  <div key={idx}>{err.error}</div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Temperature</label>
            <Select value={temperature.toString()} onValueChange={(value) => {
              const newTemp = parseFloat(value);
              data?.onUpdate?.(id, {
                data: {
                  ...data,
                  temperature: newTemp,
                  config: {
                    ...data?.config,
                    temperature: newTemp
                  }
                }
              });
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select temperature" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="0.0">0.0 (Deterministic)</SelectItem>
                  <SelectItem value="0.1">0.1 (Very Low)</SelectItem>
                  <SelectItem value="0.3">0.3 (Low)</SelectItem>
                  <SelectItem value="0.7">0.7 (Medium)</SelectItem>
                  <SelectItem value="1.0">1.0 (High)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Prompt</label>
            <div className="min-h-[80px] p-2 text-sm bg-input border border-border rounded focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
              <div className="flex flex-col gap-1">
                {renderTokenizedSystemPrompt().map((token, index) => {
                  if (token.type === "editable") {
                    return (
                      <textarea
                        key={`${token.key}-${index}`}
                        className="flex-1 min-w-[200px] bg-transparent border-none outline-none resize-none nodrag"
                        placeholder="Enter system prompt..."
                        value={token.content}
                        onChange={(e) => {
                          data?.onUpdate?.(id, {
                            data: {
                              ...data,
                              systemPrompt: e.target.value,
                              config: {
                                ...data?.config,
                                systemPrompt: e.target.value
                              }
                            }
                          });
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        rows={Math.max(2, Math.ceil(token.content.length / 50))}
                        style={{ minHeight: '40px' }}
                      />
                    );
                  }
                  return null;
                })}

                <div className="relative w-full h-4">
                  <div className="absolute -left-6">
                    <CustomHandle
                      type="target"
                      position={Position.Left}
                      id="context"
                      label={
                        <div className={`flex items-center gap-2 ${hasContext ? '' : 'opacity-50'}`}>
                          <span className="text-purple-500">Context: </span>
                          <span>{`{context}`}</span>
                        </div>
                      }
                      className="!border-green-500 hover:!border-green-400"
                      labelClassname="gap-5"
                      style={{ borderColor: '#10b981' }}
                      tooltipComponents={
                        [
                          "knowledgeBase"
                        ]
                      }
                    />
                  </div>
                </div>
                <div className="relative w-full h-4">
                  <div className="absolute -left-6">
                    <CustomHandle
                      type="target"
                      position={Position.Left}
                      id="query"
                      label={
                        <div className={`flex items-center gap-2 ${hasQuery ? '' : 'opacity-50'}`}>
                          <span className="text-purple-500">Query: </span>
                          <span>{`{query}`}</span>
                        </div>
                      }
                      className="!border-blue-500 hover:!border-blue-400"
                      labelClassname="gap-5"
                      style={{ borderColor: '#3b82f6' }}
                      tooltipComponents={
                        [
                          "userQuery"
                        ]
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full mt-8">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor={`webSearch-${id}`} className="text-xs font-medium text-muted-foreground">
                Enable Web Search
              </label>
              <Switch
                id={`webSearch-${id}`}
                checked={webSearchEnabled}
                onCheckedChange={(enabled) => {
                  data?.onUpdate?.(id, { 
                    data: { 
                      ...data, 
                      webSearchEnabled: enabled,
                      config: {
                        ...data?.config,
                        webSearchEnabled: enabled
                      }
                    } 
                  });
                }}
                className="nodrag"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {webSearchEnabled && (
              <>
                <Separator />
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      SerpAPI Key
                    </label>
                    <div className="relative">
                      <input
                        type={showSerpKey ? "text" : "password"}
                        className={`w-full p-2 pr-8 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent nodrag ${serpKeyErrors.length > 0 ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                        placeholder="Enter SerpAPI API key..."
                        value={data?.serpApiKey || ''}
                        onChange={e => {
                          data?.onUpdate?.(id, { 
                            data: { 
                              ...data, 
                              serpApiKey: e.target.value,
                              config: {
                                ...data?.config,
                                serpApiKey: e.target.value
                              }
                            } 
                          });
                          if (e.target.value && typeof data?.clearValidationError === 'function') {
                            data.clearValidationError(id, 'llmEngine', 'serpApiKey');
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        aria-invalid={serpKeyErrors.length > 0}
                        aria-describedby={serpKeyErrors.length > 0 ? `${id}-serp-key-error` : undefined}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground nodrag"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSerpKey(!showSerpKey);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {showSerpKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {serpKeyErrors.length > 0 && (
                      <div id={`${id}-serp-key-error`} className="text-xs text-destructive mt-1">
                        {serpKeyErrors.map((err, idx) => (
                          <div key={idx}>{err.error}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="relative w-full h-4 mt-8">
          <div className="absolute -right-5">
            <CustomHandle
              type="source"
              position={Position.Right}
              label="Output"
              tooltipComponents={
                [
                  "output"
                ]
              }
            />
          </div>
        </div>
      </div>
    </NodeWrapper>
  );
};