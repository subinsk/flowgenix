import api from './api';

export interface Document {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
  file_path: string;
  upload_date: string;
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

  downloadDocument: async (documentId: string, filename: string): Promise<void> => {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    
    // Create blob link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },

  searchDocuments: async (query: string): Promise<any[]> => {
    const response = await api.post('/documents/search', { query });
    return response.data;
  },
};
