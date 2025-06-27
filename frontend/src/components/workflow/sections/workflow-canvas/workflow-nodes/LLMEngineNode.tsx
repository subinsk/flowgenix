import { useState } from "react";
import { NodeWrapper } from "@/components";
import { Brain, Eye, EyeOff } from "lucide-react";
import type { NodeFieldError } from "@/hooks";

export const LLMEngineNode = ({ id, data, selected }: any) => {
  // Use the new error structure: { nodeId, nodeType, field, error }
  const nodeErrors: NodeFieldError[] = (data?.validationErrors || []).filter(
    (err: NodeFieldError) => err.nodeId === id && err.nodeType === "llmEngine"
  );
  // Model errors (field-specific)
  const modelErrors = nodeErrors.filter((err) => err.field === "model");
  // API key errors (field-specific)
  const apiKeyErrors = nodeErrors.filter((err) => err.field === "apiKey");
  // Web search API key errors
  const serpKeyErrors = nodeErrors.filter((err) => err.field === "serpApiKey");
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSerpKey, setShowSerpKey] = useState(false);

  const hasContext = data?.inputTypes?.includes("context") || (data?.hasInput && data?.inputType === "context");
  const hasQuery = data?.inputTypes?.includes("query") || (data?.hasInput && data?.inputType === "query");

  // Controlled values from data with fallbacks
  const webSearchEnabled = data?.webSearchEnabled || false;
  const temperature = data?.temperature !== undefined ? data.temperature : 0.7;

  const renderTokenizedSystemPrompt = () => {
    const basePrompt = data?.systemPrompt || "You are a helpful AI assistant.";
    const tokens = [];
    
    // Add the base editable prompt
    tokens.push({
      type: "editable",
      content: basePrompt,
      key: "base"
    });
    
    // Add connected entity tokens
    if (hasQuery) {
      tokens.push({
        type: "token",
        content: "Query Input",
        key: "query",
        color: "bg-blue-100 text-blue-700 border-blue-200"
      });
    }
    
    if (hasContext) {
      tokens.push({
        type: "token", 
        content: "Context Input",
        key: "context",
        color: "bg-green-100 text-green-700 border-green-200"
      });
    }
    
    return tokens;
  };

  // Model name mapping for backend/UI sync
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
      validationErrors={data?.validationErrors || []}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-foreground">LLM Engine</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Model</label>
            <select
              className={`w-full p-2 text-sm bg-input border rounded focus:ring-2 focus:ring-primary focus:border-transparent nodrag ${modelErrors.length > 0 ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
              value={MODEL_NAME_MAP_REVERSE[data?.model] || data?.model || ''}
              onChange={e => {
                const uiValue = e.target.value;
                const backendValue = MODEL_NAME_MAP[uiValue] || uiValue;
                data?.onUpdate?.(id, { data: { ...data, model: backendValue } });
                if (uiValue && typeof data?.clearValidationError === 'function') {
                  data.clearValidationError(id, 'llmEngine', 'model');
                }
              }}
              onMouseDown={e => e.stopPropagation()}
              onFocus={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
              aria-invalid={modelErrors.length > 0}
              aria-describedby={modelErrors.length > 0 ? `${id}-llm-model-error` : undefined}
            >
              <option value="">Select Model</option>
              <option value="GPT-4">GPT-4</option>
              <option value="GPT-4 Turbo">GPT-4 Turbo</option>
              <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
              <option value="Gemini Pro">Gemini Pro</option>
              <option value="Gemini 2.0 Flash">Gemini 2.0 Flash</option>
              <option value="Claude 3">Claude 3</option>
            </select>
            {modelErrors.length > 0 && (
              <div id={`${id}-llm-model-error`} className="text-xs text-destructive mt-1">
                {modelErrors.map((err, idx) => (
                  <div key={idx}>{err.error}</div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Model API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                className={`w-full p-2 pr-8 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent nodrag ${apiKeyErrors.length > 0 ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                placeholder="Enter API key..."
                value={data?.apiKey || ''}
                onChange={e => {
                  data?.onUpdate?.(id, { data: { ...data, apiKey: e.target.value } });
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
            <select
              className="w-full p-2 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent nodrag"
              value={temperature}
              onChange={(e) => {
                const newTemp = parseFloat(e.target.value);
                data?.onUpdate?.(id, { data: { ...data, temperature: newTemp } });
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <option value={0.0}>0.0 (Deterministic)</option>
              <option value={0.1}>0.1 (Very Low)</option>
              <option value={0.3}>0.3 (Low)</option>
              <option value={0.7}>0.7 (Medium)</option>
              <option value={1.0}>1.0 (High)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`webSearch-${id}`}
              checked={webSearchEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                data?.onUpdate?.(id, { data: { ...data, webSearchEnabled: enabled } });
              }}
              className="w-4 h-4 nodrag"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
            <label htmlFor={`webSearch-${id}`} className="text-xs font-medium text-muted-foreground">
              Enable Web Search
            </label>
          </div>
          {webSearchEnabled && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">SERP API Key</label>
              <div className="relative">
                <input
                  type={showSerpKey ? "text" : "password"}
                  className={`w-full p-2 pr-8 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent nodrag ${serpKeyErrors.length > 0 ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                  placeholder="Enter SERP API key..."
                  value={data?.serpApiKey || ''}
                  onChange={e => {
                    data?.onUpdate?.(id, { data: { ...data, serpApiKey: e.target.value } });
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
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">System Prompt</label>
            <div className="min-h-[80px] p-2 text-sm bg-input border border-border rounded focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
              <div className="flex flex-wrap gap-1 items-start">
                {renderTokenizedSystemPrompt().map((token, index) => {
                  if (token.type === "editable") {
                    return (
                      <textarea
                        key={token.key}
                        className="flex-1 min-w-[200px] bg-transparent border-none outline-none resize-none nodrag"
                        placeholder="Enter system prompt..."
                        value={token.content}
                        onChange={(e) => {
                          data?.onUpdate?.(id, { data: { ...data, systemPrompt: e.target.value } });
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        rows={Math.max(2, Math.ceil(token.content.length / 50))}
                        style={{ minHeight: '40px' }}
                      />
                    );
                  } else {
                    return (
                      <span
                        key={token.key}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${token.color}`}
                      >
                        {token.content}
                      </span>
                    );
                  }
                })}
              </div>
              {(hasQuery || hasContext) && (
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  Connected inputs will be automatically appended to your system prompt
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {hasQuery && (
            <div className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Query Input</div>
          )}
          {hasContext && (
            <div className="text-xs px-2 py-1 bg-green-500 text-white rounded">Context Input</div>
          )}
        </div>
      </div>
    </NodeWrapper>
  );
};