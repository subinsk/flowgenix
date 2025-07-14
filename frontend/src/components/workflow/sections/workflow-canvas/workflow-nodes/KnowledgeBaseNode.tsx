import { useState, useRef } from "react";
import { NodeWrapper } from "@/components";
import { BookOpen, Eye, EyeOff, UploadCloud, X, Download, CheckCircle, AlertCircle } from "lucide-react";
import { documentService } from "@/services/documentService";
import { useParams } from "next/navigation";
import { CustomHandle } from "./CustomHandle";
import { Position } from "@xyflow/react";
import { Icon as Iconify } from "@iconify/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

export const KnowledgeBaseNode = ({ id, data, selected }: any) => {
  // Aggregate all errors for this node type (knowledgeBase) for this node
  const nodeTypeErrors = (data?.validationErrors || [])
    .filter((err: { nodeId: string; nodeType: string; error: string }) =>
      err.nodeId === id && (err.nodeType === 'knowledgeBase')
    );
  // File input errors
  const fileInputErrors = nodeTypeErrors.filter((err: { error: string }) => err.error.toLowerCase().includes('file'));
  // API key errors
  const apiKeyErrors = nodeTypeErrors.filter((err: { error: string }) => err.error.toLowerCase().includes('api key'));
  const [showApiKey, setShowApiKey] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const workflowId = params?.id as string;

  const hasQueryInput = data?.inputTypes?.includes('query') || (data?.hasInput && data?.inputType === 'query');
  const fileList = Array.isArray(data?.fileList) ? data.fileList : [];
  const uploadedDocuments = Array.isArray(data?.uploadedDocuments) ? data.uploadedDocuments : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    data?.onUpdate?.(id, { data: { ...data, file: files, fileList: Array.from(files || []) } });
    if (files && files.length > 0 && typeof data?.clearValidationError === 'function') {
      data.clearValidationError(id, 'knowledgeBase', 'file');
    }
    // Trigger file upload with embedding model and API key
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files));
    }
  };

  const handleFileUpload = async (files: File[]) => {
    const embeddingModel = data?.embeddingModel || 'all-MiniLM-L6-v2';
    const apiKey = data?.apiKey;

    if (!apiKey) {
      console.warn('No API key provided for embedding model');
      // You could show a toast notification here
      return;
    }

    if (!workflowId) {
      console.warn('No workflow ID available for file upload');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    try {
      const { workflowService } = await import('@/services/workflowService');
      const result = await workflowService.uploadDocuments(workflowId, files, embeddingModel, apiKey);
      console.log('Files uploaded successfully:', result);

      // Update node data with uploaded documents
      data?.onUpdate?.(id, {
        data: {
          ...data,
          uploadedDocuments: [...uploadedDocuments, ...result.files],
          file: null, // Clear the file input
          fileList: [] // Clear the file list
        }
      });

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear validation errors for successful upload
      if (typeof data?.clearValidationError === 'function') {
        data.clearValidationError(id, 'knowledgeBase', 'file');
      }

      setUploadStatus('success');
      // Reset status after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);

    } catch (error) {
      console.error('File upload failed:', error);
      setUploadStatus('error');
      // Reset status after 5 seconds
      setTimeout(() => setUploadStatus('idle'), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    data?.onUpdate?.(id, { data: { ...data, file: null, fileList: [] } });
    if (typeof data?.clearValidationError === 'function') {
      data.clearValidationError(id, 'knowledgeBase', 'file');
    }
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      // Try to download via the document service first (for database tracked files)
      await documentService.downloadDocument(documentId, filename);
    } catch (error) {
      console.error('Download failed:', error);
      // Show a brief error status
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleRemoveDocument = (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation();
    const updatedDocuments = uploadedDocuments.filter((doc: any) => doc.id !== documentId);
    data?.onUpdate?.(id, {
      data: {
        ...data,
        uploadedDocuments: updatedDocuments
      }
    });
  };

  return (
    <NodeWrapper
      type="knowledgeBase"
      selected={selected}
      onSettings={data?.onSettings}
      onDelete={data?.onDelete}
      id={id}
      validationErrors={data?.validationErrors || []}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <BookOpen className={`w-5 h-5 text-[#444444]/80`} />
        <h3 className="font-semibold text-foreground">Knowledge Base</h3>
        {uploadStatus === 'success' && (
          <div title="Upload successful">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        )}
        {uploadStatus === 'error' && (
          <div title="Upload failed">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      <div className="bg-[#EDF3FF] px-4 py-1.5 text-sm">
        Let LLM search info in your file
      </div>
      <div className="p-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">File for Knowledge Base</label>
            {fileList.length === 0 && uploadedDocuments.length === 0 ? (
              <button
                type="button"
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 h-24 rounded border border-dashed border-primary text-sm text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary ${fileInputErrors.length > 0 ? 'border-destructive ring-1 ring-destructive' : 'border-primary'} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  if (!isUploading) {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={isUploading}
                aria-invalid={fileInputErrors.length > 0}
                aria-describedby={fileInputErrors.length > 0 ? `${id}-kb-file-error` : undefined}
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
                <Iconify icon="lucide:upload" className="w-4 h-4" />
              </button>
            ) : fileList.length > 0 ? (
              <div className="flex items-center gap-2 bg-primary/10 px-2 py-1 rounded border border-primary">
                <span className="text-xs text-primary">
                  {isUploading ? 'Uploading...' : fileList[0]?.name}
                </span>
                {!isUploading && (
                  <button
                    type="button"
                    className="ml-1 text-primary hover:text-destructive"
                    onClick={handleRemoveFile}
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.txt,.docx"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {fileInputErrors.length > 0 && (
              <div id={`${id}-kb-file-error`} className="text-xs text-destructive mt-1">
                {fileInputErrors.map((err: { error: string }, idx: number) => (
                  <div key={idx}>{err.error}</div>
                ))}
              </div>
            )}
          </div>

          {/* Display uploaded documents */}
          {uploadedDocuments.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Uploaded Documents ({uploadedDocuments.length})
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {uploadedDocuments.map((doc: any, index: number) => (
                  <div key={doc.id || index} className="flex items-center gap-2 bg-muted px-2 py-1 rounded border border-border">
                    <span className="text-xs text-foreground flex-1 truncate" title={doc.filename}>
                      {doc.filename}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {doc.file_size ? (
                        doc.file_size < 1024
                          ? `${doc.file_size}B`
                          : doc.file_size < 1024 * 1024
                            ? `${Math.ceil(doc.file_size / 1024)}KB`
                            : `${(doc.file_size / (1024 * 1024)).toFixed(1)}MB`
                      ) : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => handleDownloadDocument(doc.id, doc.filename)}
                        aria-label="View/Download file"
                        title="View/Download file"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleRemoveDocument(e, doc.id)}
                        aria-label="Remove file"
                        title="Remove file"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                onClick={e => {
                  e.stopPropagation();
                  if (!isUploading) {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={isUploading}
              >
                <Iconify icon="lucide:upload" className="w-4 h-4" />
                Add More Files
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Embedding Model</label>
            <div className="nodrag">
              <Select
                value={data?.embeddingModel || 'all-MiniLM-L6-v2'}
                onValueChange={value => data?.onUpdate?.(id, { 
                  data: { 
                    ...data, 
                    embeddingModel: value,
                    config: { 
                      ...data?.config, 
                      embeddingModel: value 
                    } 
                  } 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select embedding model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                  <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                  <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                  <SelectItem value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (HuggingFace)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                className={`w-full p-2 pr-8 text-sm bg-input border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent nodrag ${apiKeyErrors.length > 0 ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
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
                    data.clearValidationError(id, 'knowledgeBase', 'apiKey');
                  }
                }}
                onMouseDown={e => e.stopPropagation()}
                onFocus={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                aria-invalid={apiKeyErrors.length > 0}
                aria-describedby={apiKeyErrors.length > 0 ? `${id}-api-key-error` : undefined}
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
              <div id={`${id}-api-key-error`} className="text-xs text-destructive mt-1">
                {apiKeyErrors.map((err: { error: string }, idx: number) => (
                  <div key={idx}>{err.error}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="relative w-full h-4 mt-8">
          <div className="absolute -left-5">
            <CustomHandle
              type="target"
              position={Position.Left}
              label="Query"
              tooltipComponents={["userQuery"]}
            />
          </div>
        </div>

        <div className="relative w-full h-4 mt-8">
          <div className="absolute -right-5">
            <CustomHandle
              type="source"
              position={Position.Right}
              label="Context"
              tooltipComponents={["llmEngine"]}
            />
          </div>
        </div>
        {/* <div className="mt-3 flex flex-wrap gap-1">
          {hasQueryInput && (
            <div className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Query Connected</div>
          )}
          {data?.inputTypes?.includes('context') && (
            <div className="text-xs px-2 py-1 bg-green-500 text-white rounded">Context Connected</div>
          )}
        </div> */}
      </div>
    </NodeWrapper>
  );
};
