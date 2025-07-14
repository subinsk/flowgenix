'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { apiKeyService, ApiKeyResponse } from '@/services/apiKeyService';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_KEY_TYPES = [
  { name: 'openai', label: 'OpenAI API Key', description: 'For GPT models and OpenAI embeddings' },
  { name: 'serpapi', label: 'SerpAPI Key', description: 'For web search functionality' },
  { name: 'brave', label: 'Brave Search API Key', description: 'For Brave search engine' },
  { name: 'huggingface', label: 'HuggingFace API Key', description: 'For HuggingFace models' }
];

export default function ApiKeyManager({ isOpen, onClose }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeyResponse[]>([]);
  const [newKeys, setNewKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
    }
  }, [isOpen]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeyService.getApiKeys();
      setApiKeys(response.api_keys);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (keyName: string) => {
    const keyValue = newKeys[keyName];
    if (!keyValue?.trim()) return;

    try {
      setSaving(prev => ({ ...prev, [keyName]: true }));
      await apiKeyService.createOrUpdateApiKey({
        key_name: keyName,
        api_key: keyValue
      });
      
      await loadApiKeys();
      
      setNewKeys(prev => ({ ...prev, [keyName]: '' }));
      setShowKeys(prev => ({ ...prev, [keyName]: false }));
    } catch (error) {
      console.error('Error saving API key:', error);
    } finally {
      setSaving(prev => ({ ...prev, [keyName]: false }));
    }
  };

  const handleDeleteKey = async (keyName: string) => {
    if (!confirm(`Are you sure you want to delete the ${keyName} API key?`)) {
      return;
    }

    try {
      await apiKeyService.deleteApiKey(keyName);
      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const toggleShowKey = (keyName: string) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleKeyChange = (keyName: string, value: string) => {
    setNewKeys(prev => ({ ...prev, [keyName]: value }));
  };

  const getExistingKey = (keyName: string) => {
    return apiKeys.find(key => key.key_name === keyName);
  };

  if (!isOpen) return null;

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
          className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">API Key Management</h3>
                  <p className="text-sm text-muted-foreground">Manage your API keys for various services</p>
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
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {API_KEY_TYPES.map(keyType => {
                  const existingKey = getExistingKey(keyType.name);
                  const currentValue = newKeys[keyType.name] || '';
                  const isVisible = showKeys[keyType.name];
                  const isSaving = saving[keyType.name];

                  return (
                    <div key={keyType.name} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{keyType.label}</h4>
                          <p className="text-xs text-muted-foreground">{keyType.description}</p>
                          {existingKey && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-green-600">✓ Configured</span>
                              <span className="text-xs text-muted-foreground">
                                Last updated: {new Date(existingKey.updated_at || existingKey.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        {existingKey && (
                          <button
                            onClick={() => handleDeleteKey(keyType.name)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            title="Delete API key"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={isVisible ? 'text' : 'password'}
                            value={currentValue}
                            onChange={(e) => handleKeyChange(keyType.name, e.target.value)}
                            placeholder={existingKey ? 'Enter new key to update...' : 'Enter API key...'}
                            className="w-full p-3 pr-10 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(keyType.name)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <Button
                          onClick={() => handleSaveKey(keyType.name)}
                          disabled={!currentValue.trim() || isSaving}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {isSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Save size={16} />
                          )}
                          {existingKey ? 'Update' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              API keys are securely encrypted and stored in your account.
            </div>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
