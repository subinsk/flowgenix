import api from './api';

export interface ApiKeyData {
  key_name: string;
  api_key: string;
}

export interface ApiKeyResponse {
  id: string;
  key_name: string;
  created_at: string;
  updated_at?: string;
}

export interface ApiKeysListResponse {
  api_keys: ApiKeyResponse[];
}

export interface ApiKeyValueResponse {
  key_name: string;
  api_key: string;
}

class ApiKeyService {
  
  async createOrUpdateApiKey(keyData: ApiKeyData): Promise<ApiKeyResponse> {
    try {
      const response = await api.post('/api-keys/', keyData);
      return response.data;
    } catch (error) {
      console.error('Error creating/updating API key:', error);
      throw error;
    }
  }

  async getApiKeys(): Promise<ApiKeysListResponse> {
    try {
      const response = await api.get('/api-keys/');
      return response.data;
    } catch (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }
  }

  async getApiKeyValue(keyName: string): Promise<ApiKeyValueResponse> {
    try {
      const response = await api.get(`/api-keys/${keyName}/value`);
      return response.data;
    } catch (error) {
      console.error('Error fetching API key value:', error);
      throw error;
    }
  }

  async updateApiKey(keyName: string, apiKey: string): Promise<ApiKeyResponse> {
    try {
      const response = await api.put(`/api-keys/${keyName}`, { api_key: apiKey });
      return response.data;
    } catch (error) {
      console.error('Error updating API key:', error);
      throw error;
    }
  }

  async deleteApiKey(keyName: string): Promise<void> {
    try {
      await api.delete(`/api-keys/${keyName}`);
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  }

  // Helper method to check if a specific API key exists
  async hasApiKey(keyName: string): Promise<boolean> {
    try {
      const response = await this.getApiKeys();
      return response.api_keys.some(key => key.key_name === keyName);
    } catch (error) {
      return false;
    }
  }

  // Helper method to get stored API key for workflow execution
  async getStoredApiKey(keyName: string): Promise<string | null> {
    try {
      const response = await this.getApiKeyValue(keyName);
      return response.api_key;
    } catch (error) {
      return null;
    }
  }
}

export const apiKeyService = new ApiKeyService();
