'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2, Upload, Download, HelpCircle, Eye, EyeOff, Key } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import ApiKeyManager from './ApiKeyManager';
import { apiKeyService } from '@/services/apiKeyService';
import { NODE_TYPE_MAP } from '@/constants';
import { PROMPT_TEMPLATES } from '@/constants/promptTemplates';

interface NodeConfigurationPanelProps {
  selectedNode: any;
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: any) => void;
  onDeleteNode: (nodeId: string) => void;
}

const predefinedConfigs = {
  userQuery: [
    { name: 'Simple Query', query: 'What is the main topic?' },
    { name: 'Detailed Analysis', query: 'Provide a detailed analysis of the content including key points, insights, and recommendations.' },
    { name: 'Summary Request', query: 'Please summarize the key points in bullet format.' },
    { name: 'Document Analysis', query: 'Can you give me a comprehensive analysis of this document?' },
    { name: 'Report Summary', query: 'Hey can you give me summary of my attached document' }
  ],
  knowledgeBase: [
    { name: 'MiniLM (HuggingFace)', model: 'all-MiniLM-L6-v2', chunkSize: 1000 },
    { name: 'OpenAI Embeddings', model: 'text-embedding-ada-002', chunkSize: 1000 },
    { name: 'High Quality Embeddings', model: 'text-embedding-3-large', chunkSize: 500 },
    { name: 'Fast Embeddings', model: 'text-embedding-3-small', chunkSize: 1500 }
  ],
  llmEngine: [
    ...PROMPT_TEMPLATES.map(template => ({
      name: template.name,
      model: template.name === 'PDF Summarizer' ? 'GPT-4' : 'GPT-3.5 Turbo',
      temperature: template.name === 'PDF Summarizer' ? 0.5 : 0.7,
      maxTokens: template.name === 'Report Analyzer' ? 2000 : 1000,
      systemPrompt: template.prompt
    }))
  ],
  output: [
    { name: 'Formatted Output', format: 'markdown', includeMetadata: true },
    { name: 'Plain Text', format: 'text', includeMetadata: false },
    { name: 'Structured JSON', format: 'json', includeMetadata: true }
  ]
};

export default function NodeConfigurationPanel({
  selectedNode,
  onClose,
  onUpdateNode,
  onDeleteNode
}: NodeConfigurationPanelProps) {
  const [config, setConfig] = useState(selectedNode?.data || {});
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSerpKey, setShowSerpKey] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [hasStoredKeys, setHasStoredKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check for stored API keys
    const checkStoredKeys = async () => {
      const keyChecks = await Promise.all([
        apiKeyService.hasApiKey('openai'),
        apiKeyService.hasApiKey('serpapi'),
        apiKeyService.hasApiKey('brave'),
        apiKeyService.hasApiKey('huggingface')
      ]);

      setHasStoredKeys({
        openai: keyChecks[0],
        serpapi: keyChecks[1],
        brave: keyChecks[2],
        huggingface: keyChecks[3]
      });
    };

    checkStoredKeys();
  }, [showApiKeyManager]); // Refresh when API key manager is closed

  if (!selectedNode) return null;

  const handleConfigChange = (key: string, value: any) => {
    const updatedConfig = { ...config, [key]: value };
    setConfig(updatedConfig);
    onUpdateNode(selectedNode.id, { data: updatedConfig });
  };

  const applyPredefinedConfig = (preconfig: any) => {
    const updatedConfig = { ...config, ...preconfig };
    setConfig(updatedConfig);
    onUpdateNode(selectedNode.id, { data: updatedConfig });
  };

  const exportConfig = () => {
    const configData = JSON.stringify(config, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNode.type}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string);
          const updatedConfig = { ...config, ...importedConfig };
          setConfig(updatedConfig);
          onUpdateNode(selectedNode.id, { data: updatedConfig });
        } catch (error) {
          console.error('Error importing config:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const renderUserQueryConfig = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-foreground mb-2">
          User Query
        </label>
         <Tooltip>
            <TooltipTrigger className="p-0" asChild>
              <HelpCircle size={14} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Enter the query that will be processed by the workflow</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <textarea
          className="w-full p-3 text-sm bg-input border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Write your query here..."
          rows={3}
          value={config.query || ''}
          onChange={(e) => handleConfigChange('query', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Query Type
        </label>
        <select
          className="w-full p-3 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          value={config.queryType || 'general'}
          onChange={(e) => handleConfigChange('queryType', e.target.value)}
        >
          <option value="general">General Question</option>
          <option value="analysis">Analysis Request</option>
          <option value="summary">Summary Request</option>
          <option value="extraction">Data Extraction</option>
        </select>
      </div>
    </div>
  );

  const renderKnowledgeBaseConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Embedding Model
          <button
            className="ml-2 text-muted-foreground hover:text-foreground"
            title="Choose the embedding model for text processing"
          >
            <HelpCircle size={16} />
          </button>
        </label>
        <select
          className="w-full p-3 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          value={config.embeddingModel || 'all-MiniLM-L6-v2'}
          onChange={(e) => handleConfigChange('embeddingModel', e.target.value)}
        >
          <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (HuggingFace)</option>
          <option value="text-embedding-ada-002">text-embedding-ada-002</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Chunk Size
        </label>
        <input
          type="number"
          className="w-full p-3 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="1000"
          value={config.chunkSize || 1000}
          onChange={(e) => handleConfigChange('chunkSize', parseInt(e.target.value))}
          min="100"
          max="8000"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">
            API Key
          </label>
          <div className="flex items-center gap-2">
            {hasStoredKeys.openai && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓ Stored
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowApiKeyManager(true)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <Key size={12} />
              Manage Keys
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            className="w-full p-3 pr-10 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={hasStoredKeys.openai ? "Using stored key (leave blank)" : "Enter API key..."}
            value={config.apiKey || ''}
            onChange={(e) => handleConfigChange('apiKey', e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {hasStoredKeys.openai && !config.apiKey && (
          <p className="text-xs text-muted-foreground mt-1">
            Will use your stored OpenAI API key
          </p>
        )}
      </div>
    </div>
  );

  const renderLLMEngineConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Model
        </label>
        <select
          className="w-full p-3 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          value={config.model || 'GPT-4'}
          onChange={(e) => handleConfigChange('model', e.target.value)}
        >
          <option value="GPT-4">GPT-4</option>
          <option value="GPT-4 Turbo">GPT-4 Turbo</option>
          <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
          <option value="Gemini Pro">Gemini Pro</option>
          <option value="Claude 3">Claude 3</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Temperature: {config.temperature || 0.7}
          <button
            className="ml-2 text-muted-foreground hover:text-foreground"
            title="Controls randomness: 0 = focused, 1 = creative"
          >
            <HelpCircle size={16} />
          </button>
        </label>
        <input
          type="range"
          className="w-full"
          min="0"
          max="1"
          step="0.1"
          value={config.temperature || 0.7}
          onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Max Tokens
        </label>
        <input
          type="number"
          className="w-full p-3 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="1000"
          value={config.maxTokens || 1000}
          onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
          min="50"
          max="8000"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="webSearch"
          className="rounded border-border"
          checked={config.webSearchEnabled || false}
          onChange={(e) => handleConfigChange('webSearchEnabled', e.target.checked)}
        />
        <label htmlFor="webSearch" className="text-sm font-medium text-foreground">
          Enable Web Search
        </label>
      </div>

      {config.webSearchEnabled && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              SERP API Key
            </label>
            <div className="flex items-center gap-2">
              {hasStoredKeys.serpapi && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✓ Stored
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowApiKeyManager(true)}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <Key size={12} />
                Manage Keys
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type={showSerpKey ? "text" : "password"}
              className="w-full p-3 pr-10 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={hasStoredKeys.serpapi ? "Using stored key (leave blank)" : "Enter SERP API key..."}
              value={config.serpApiKey || ''}
              onChange={(e) => handleConfigChange('serpApiKey', e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowSerpKey(!showSerpKey)}
            >
              {showSerpKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {hasStoredKeys.serpapi && !config.serpApiKey && (
            <p className="text-xs text-muted-foreground mt-1">
              Will use your stored SerpAPI key
            </p>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">
            API Key
          </label>
          <div className="flex items-center gap-2">
            {hasStoredKeys.openai && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓ Stored
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowApiKeyManager(true)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <Key size={12} />
              Manage Keys
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            className="w-full p-3 pr-10 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={hasStoredKeys.openai ? "Using stored key (leave blank)" : "Enter API key..."}
            value={config.apiKey || ''}
            onChange={(e) => handleConfigChange('apiKey', e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {hasStoredKeys.openai && !config.apiKey && (
          <p className="text-xs text-muted-foreground mt-1">
            Will use your stored OpenAI API key
          </p>
        )}
      </div>
    </div>
  );

  const renderOutputConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Output Format
        </label>
        <select
          className="w-full p-3 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          value={config.format || 'markdown'}
          onChange={(e) => handleConfigChange('format', e.target.value)}
        >
          <option value="markdown">Markdown</option>
          <option value="text">Plain Text</option>
          <option value="json">JSON</option>
          <option value="html">HTML</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="includeMetadata"
          className="rounded border-border"
          checked={config.includeMetadata || false}
          onChange={(e) => handleConfigChange('includeMetadata', e.target.checked)}
        />
        <label htmlFor="includeMetadata" className="text-sm font-medium text-foreground">
          Include Metadata
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="saveToFile"
          className="rounded border-border"
          checked={config.saveToFile || false}
          onChange={(e) => handleConfigChange('saveToFile', e.target.checked)}
        />
        <label htmlFor="saveToFile" className="text-sm font-medium text-foreground">
          Save to File
        </label>
      </div>
    </div>
  );

  const renderConfigContent = () => {
    switch (selectedNode.type) {
      case 'userQuery':
        return renderUserQueryConfig();
      case 'knowledgeBase':
        return renderKnowledgeBaseConfig();
      case 'llmEngine':
        return renderLLMEngineConfig();
      case 'output':
        return renderOutputConfig();
      default:
        return <div>No configuration available for this node type.</div>;
    }
  };

  const getNodeIcon = () => {
    const { icon } = NODE_TYPE_MAP[selectedNode.type]
    const Icon = icon;
    return <Icon className="w-10 h-10 text-[#444444]" />

  };

  const getNodeName = () => {
    switch (selectedNode.type) {
      case 'userQuery': return 'User Query';
      case 'knowledgeBase': return 'Knowledge Base';
      case 'llmEngine': return 'LLM Engine';
      case 'output': return 'Output';
      default: return 'Component';
    }
  };

  const preconfigs = predefinedConfigs[selectedNode.type as keyof typeof predefinedConfigs] || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getNodeIcon()}
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{getNodeName()} Configuration</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedNode.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Predefined Configurations */}
            {preconfigs.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-3">Quick Setup</h4>
                <div className="grid grid-cols-1 gap-2">
                  {preconfigs.map((preconfig, index) => (
                    <Button
                      variant="outline"
                      key={index}
                      onClick={() => applyPredefinedConfig(preconfig)}
                      className="p-3 text-left items-start flex flex-col h-16"
                    >
                      <div className="font-medium text-foreground">{preconfig.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Object.entries(preconfig).slice(1, 3).map(([key, value]) =>
                          `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`
                        ).join(', ')}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration Fields */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Configuration</h4>
              {renderConfigContent()}
            </div>

            {/* Import/Export */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Configuration Management</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportConfig}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Export
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importConfig}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Upload size={16} />
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDeleteNode(selectedNode.id);
                onClose();
              }}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete Node
            </Button>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* API Key Manager Modal */}
      <ApiKeyManager
        isOpen={showApiKeyManager}
        onClose={() => setShowApiKeyManager(false)}
      />
    </AnimatePresence>
  );
}
