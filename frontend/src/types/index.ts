export type ViewMode = 'dashboard' | 'projects' | 'explorer' | 'chat' | 'settings';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  language?: string;
  children?: FileNode[];
  content?: string;
  lineCount?: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  uploadedAt: string;
  fileCount: number;
  totalSize: string;
  status: 'indexed' | 'indexing' | 'error' | 'sample';
  primaryLanguage: string;
  branch?: string;
  gitCommit?: string;
  tags: string[];
}

export interface ProjectStats {
  totalProjects: number;
  indexedFiles: number;
  aiQueriesAnswered: number;
  tokensProcessed: string;
  storageUsed: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isDemoSimulation?: boolean;
  relatedFiles?: string[];
  latencyMs?: number;
}

export interface UploadProgressState {
  file: File | null;
  status: 'idle' | 'validating' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  uploadedProjectId?: string;
}

export interface BackendHealth {
  connected: boolean;
  endpoint: string;
  latency?: number;
  checkedAt?: string;
  message?: string;
}
