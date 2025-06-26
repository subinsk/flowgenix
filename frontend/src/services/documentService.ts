import api from './api';

export interface Document {
  id: string;
  filename: string;
  content?: string;
  upload_time: string;
  processed: boolean;
}

export const documentService = {
  uploadDocument: async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return response.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },

  searchDocuments: async (query: string): Promise<any[]> => {
    const response = await api.post('/documents/search', { query });
    return response.data;
  },
};
