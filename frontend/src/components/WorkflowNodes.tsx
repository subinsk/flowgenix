import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Eye, EyeOff, Trash2, Settings, MessageSquare, BookOpen, Brain, Monitor } from 'lucide-react';

interface NodeWrapperProps {
  children: React.ReactNode;
  type: string;
  selected: boolean;
  hasSource?: boolean;
  hasTarget?: boolean;
  onSettings?: () => void;
}

export const NodeWrapper: React.FC<NodeWrapperProps> = ({ 
  children, 
  type, 
  selected, 
  hasSource = true, 
  hasTarget = true,
  onSettings 
}) => (
  <div className={`min-w-[280px] bg-card border-2 rounded-lg shadow-lg transition-all duration-200 relative ${
    selected ? 'border-primary shadow-primary/20' : 'border-border hover:border-border-hover'
  }`}>
    {hasTarget && <Handle type="target" position={Position.Left} className="w-3 h-3 bg-primary" />}
    {onSettings && (
      <button
        onClick={onSettings}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
        title="Node Settings"
      >
        <Settings size={14} />
      </button>
    )}
    {children}
    {hasSource && <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary" />}
  </div>
);

// User Query Node
export const UserQueryNode = ({ id, data, selected }: any) => (
  <NodeWrapper 
    type="userQuery" 
    selected={selected} 
    hasTarget={false}
    onSettings={data?.onSettings}
  >
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3 relative">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-foreground">User Query</h3>
        <div className="flex items-center gap-1 ml-auto">
          {data?.onSettings && (
            <button
              onClick={data.onSettings}
              className="p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
              title="Node Settings"
              type="button"
            >
              <Settings size={16} />
            </button>
          )}
          {data?.onDelete && (
            <button
              className="p-1 rounded hover:bg-destructive/10 text-destructive"
              title="Delete Node"
              onClick={() => data.onDelete(id)}
              type="button"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Query Input</label>
          <textarea
            className="w-full p-2 text-sm bg-input border border-border rounded resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your query here..."
            rows={2}
            value={data?.query || ''}
            onChange={(e) => data?.onUpdate?.(id, { data: { ...data, query: e.target.value } })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Query Type</label>
          <select 
            className="w-full p-2 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
            value={data?.queryType || 'text'}
            onChange={(e) => data?.onUpdate?.(id, { data: { ...data, queryType: e.target.value } })}
          >
            <option value="text">Text Query</option>
            <option value="semantic">Semantic Search</option>
            <option value="factual">Factual Question</option>
          </select>
        </div>
      </div>
      {/* Only show Entry Point badge always for User Query */}
      <div className="mt-3 flex justify-end">
        <div className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Entry Point</div>
      </div>
    </div>
  </NodeWrapper>
);

// Knowledge Base Node
export const KnowledgeBaseNode = ({ id, data, selected }: any) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const hasQueryInput = data?.hasInput && data?.inputType === 'query';
  return (
    <NodeWrapper 
      type="knowledgeBase" 
      selected={selected}
      onSettings={data?.onSettings}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3 relative">
          <span className="text-lg">📚</span>
          <h3 className="font-semibold text-foreground">Knowledge Base</h3>
          <div className="flex items-center gap-1 ml-auto">
            {data?.onSettings && (
              <button
                onClick={data.onSettings}
                className="p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
                title="Node Settings"
                type="button"
              >
                <Settings size={16} />
              </button>
            )}
            {data?.onDelete && (
              <button
                className="p-1 rounded hover:bg-destructive/10 text-destructive"
                title="Delete Node"
                onClick={() => data.onDelete(id)}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">File Input</label>
            <input
              type="file"
              className="w-full text-sm bg-input border border-border rounded p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              multiple
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Embedding Model</label>
            <select className="w-full p-2 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent">
              <option>text-embedding-ada-002</option>
              <option>text-embedding-3-small</option>
              <option>text-embedding-3-large</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                className="w-full p-2 pr-8 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter API key..."
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
        {/* Only show Query Connected if actually connected */}
        <div className="mt-3 flex justify-between">
          {hasQueryInput && (
            <div className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Query Connected</div>
          )}
          {/* Only show Context if actually connected */}
          {data?.hasInput && data?.inputType === 'context' && (
            <div className="text-xs px-2 py-1 bg-green-500 text-white rounded ml-auto">Context</div>
          )}
        </div>
      </div>
    </NodeWrapper>
  );
};

// LLM Engine Node
export const LLMEngineNode = ({ id, data, selected }: any) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSerpKey, setShowSerpKey] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const hasContext = data?.hasInput && data?.inputType === 'context';
  const hasQuery = data?.hasInput && data?.inputType === 'query';
  const buildPrompt = () => {
    let prompt = "You are a helpful AI assistant.";
    if (hasQuery) prompt += "\n\nUser Query: {query}";
    if (hasContext) prompt += "\n\nContext: {context}";
    return prompt;
  };
  return (
    <NodeWrapper 
      type="llmEngine" 
      selected={selected}
      onSettings={data?.onSettings}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3 relative">
          <span className="text-lg">🧠</span>
          <h3 className="font-semibold text-foreground">LLM Engine</h3>
          <div className="flex items-center gap-1 ml-auto">
            {data?.onSettings && (
              <button
                onClick={data.onSettings}
                className="p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
                title="Node Settings"
                type="button"
              >
                <Settings size={16} />
              </button>
            )}
            {data?.onDelete && (
              <button
                className="p-1 rounded hover:bg-destructive/10 text-destructive"
                title="Delete Node"
                onClick={() => data.onDelete(id)}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Model</label>
            <select className="w-full p-2 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent">
              <option>GPT-4</option>
              <option>GPT-4 Turbo</option>
              <option>GPT-3.5 Turbo</option>
              <option>Gemini Pro</option>
              <option>Claude 3</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                className="w-full p-2 pr-8 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter API key..."
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">System Prompt</label>
            <textarea
              className={`w-full p-2 text-sm border border-border rounded resize-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                hasContext || hasQuery ? 'bg-muted text-muted-foreground' : 'bg-input'
              }`}
              rows={3}
              value={buildPrompt()}
              readOnly={true}
            />
            {(hasContext || hasQuery) && (
              <div className="text-xs text-muted-foreground mt-1">
                Prompt auto-generated from connections
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Temperature</label>
            <select 
              className="w-full p-2 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            >
              <option value={0.0}>0.0 - Deterministic</option>
              <option value={0.3}>0.3 - Focused</option>
              <option value={0.7}>0.7 - Balanced</option>
              <option value={1.0}>1.0 - Creative</option>
              <option value={1.5}>1.5 - Very Creative</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Web Search Tool</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={webSearchEnabled}
                onChange={(e) => setWebSearchEnabled(e.target.checked)}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          {webSearchEnabled && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Serp API Key</label>
              <div className="relative">
                <input
                  type={showSerpKey ? "text" : "password"}
                  className="w-full p-2 pr-8 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter Serp API key..."
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSerpKey(!showSerpKey)}
                >
                  {showSerpKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Only show badges if actually connected */}
        <div className="mt-3 flex justify-between items-center">
          <div className="flex gap-1">
            {hasQuery && (
              <div className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Query Connected</div>
            )}
            {hasContext && (
              <div className="text-xs px-2 py-1 bg-green-500 text-white rounded">Context Connected</div>
            )}
          </div>
          {hasQuery || hasContext ? (
            <div className="text-xs px-2 py-1 bg-purple-500 text-white rounded">Output</div>
          ) : null}
        </div>
      </div>
    </NodeWrapper>
  );
};

// Output Node
export const OutputNode = ({ id, data, selected }: any) => {
  const hasInput = data?.hasInput;
  return (
    <NodeWrapper 
      type="output" 
      selected={selected} 
      hasSource={false}
      onSettings={data?.onSettings}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3 relative">
          <span className="text-lg">📤</span>
          <h3 className="font-semibold text-foreground">Output</h3>
          <div className="flex items-center gap-1 ml-auto">
            {data?.onSettings && (
              <button
                onClick={data.onSettings}
                className="p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
                title="Node Settings"
                type="button"
              >
                <Settings size={16} />
              </button>
            )}
            {data?.onDelete && (
              <button
                className="p-1 rounded hover:bg-destructive/10 text-destructive"
                title="Delete Node"
                onClick={() => data.onDelete(id)}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Output Format</label>
            <select className="w-full p-2 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent">
              <option>Text</option>
              <option>Markdown</option>
              <option>JSON</option>
              <option>HTML</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Preview</label>
            <div className="w-full p-3 min-h-[100px] text-sm bg-muted border border-border rounded text-muted-foreground">
              Output will appear here...
            </div>
          </div>
        </div>
        {/* Only show Output badge if actually connected */}
        {hasInput && (
          <div className="mt-3 flex justify-end">
            <div className="text-xs px-2 py-1 bg-purple-500 text-white rounded">Output</div>
          </div>
        )}
      </div>
    </NodeWrapper>
  );
};
