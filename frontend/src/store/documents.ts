import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  url?: string;
  embeddings?: any[];
}

interface DocumentState {
  // Document state
  documents: Document[];
  selectedDocuments: string[];
  isUploading: boolean;
  uploadProgress: Record<string, number>;
  
  // Actions
  setDocuments: (documents: Document[]) => void;
  setSelectedDocuments: (documentIds: string[]) => void;
  setIsUploading: (uploading: boolean) => void;
  setUploadProgress: (documentId: string, progress: number) => void;
  addDocument: (document: Document) => void;
  removeDocument: (documentId: string) => void;
  updateDocument: (documentId: string, updates: Partial<Document>) => void;
  selectDocument: (documentId: string) => void;
  deselectDocument: (documentId: string) => void;
  toggleDocumentSelection: (documentId: string) => void;
  clearSelection: () => void;
  clearAll: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        documents: [],
        selectedDocuments: [],
        isUploading: false,
        uploadProgress: {},

        // Actions
        setDocuments: (documents) => set({ documents }),
        setSelectedDocuments: (selectedDocuments) => set({ selectedDocuments }),
        setIsUploading: (isUploading) => set({ isUploading }),
        
        setUploadProgress: (documentId, progress) => {
          const { uploadProgress } = get();
          set({ 
            uploadProgress: { ...uploadProgress, [documentId]: progress }
          });
        },

        addDocument: (document) => {
          const { documents } = get();
          set({ documents: [...documents, document] });
        },

        removeDocument: (documentId) => {
          const { documents, selectedDocuments } = get();
          const filteredDocuments = documents.filter((d) => d.id !== documentId);
          const filteredSelection = selectedDocuments.filter((id) => id !== documentId);
          set({ 
            documents: filteredDocuments,
            selectedDocuments: filteredSelection,
          });
        },

        updateDocument: (documentId, updates) => {
          const { documents } = get();
          const updatedDocuments = documents.map((document) =>
            document.id === documentId ? { ...document, ...updates } : document
          );
          set({ documents: updatedDocuments });
        },

        selectDocument: (documentId) => {
          const { selectedDocuments } = get();
          if (!selectedDocuments.includes(documentId)) {
            set({ selectedDocuments: [...selectedDocuments, documentId] });
          }
        },

        deselectDocument: (documentId) => {
          const { selectedDocuments } = get();
          set({ 
            selectedDocuments: selectedDocuments.filter((id) => id !== documentId)
          });
        },

        toggleDocumentSelection: (documentId) => {
          const { selectedDocuments } = get();
          if (selectedDocuments.includes(documentId)) {
            set({ 
              selectedDocuments: selectedDocuments.filter((id) => id !== documentId)
            });
          } else {
            set({ selectedDocuments: [...selectedDocuments, documentId] });
          }
        },

        clearSelection: () => set({ selectedDocuments: [] }),

        clearAll: () => set({
          documents: [],
          selectedDocuments: [],
          isUploading: false,
          uploadProgress: {},
        }),
      }),
      {
        name: 'document-store',
        partialize: (state) => ({
          documents: state.documents,
          selectedDocuments: state.selectedDocuments,
        }),
      }
    )
  )
);
