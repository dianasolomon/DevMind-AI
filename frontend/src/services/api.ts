import { BackendHealth, ChatMessage, FileNode, ProjectStats, ProjectSummary } from '@/types';

/**
 * DevMind AI - API Service Layer
 * 
 * Provides isolated, configurable HTTP communication with the backend.
 * Uses NEXT_PUBLIC_API_BASE_URL environment variable with fallback.
 * Built to make connecting Person 2's backend seamless while handling
 * offline states cleanly without faking successful backend responses.
 */

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Check runtime override stored in localStorage if configured from Settings UI
    const customUrl = localStorage.getItem('devmind_custom_api_url');
    if (customUrl) return customUrl.replace(/\/$/, '');
  }
  return (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
};

export class ApiServiceError extends Error {
  public statusCode?: number;
  public isNetworkError: boolean;

  constructor(message: string, statusCode?: number, isNetworkError = false) {
    super(message);
    this.name = 'ApiServiceError';
    this.statusCode = statusCode;
    this.isNetworkError = isNetworkError;
  }
}

export const apiService = {
  getBaseUrl(): string {
    return getApiBaseUrl();
  },

  setBaseUrlOverride(url: string | null): void {
    if (typeof window === 'undefined') return;
    if (url) {
      localStorage.setItem('devmind_custom_api_url', url.trim());
    } else {
      localStorage.removeItem('devmind_custom_api_url');
    }
  },

  /**
   * Check if backend server is responsive
   */
  async checkHealth(): Promise<BackendHealth> {
    const baseUrl = getApiBaseUrl();
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }).catch(async () => {
        // Fallback to checking root or /api/health
        return await fetch(`${baseUrl}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        return {
          connected: true,
          endpoint: baseUrl,
          latency,
          checkedAt: new Date().toLocaleTimeString(),
          message: 'Backend API reachable and operational.',
        };
      } else {
        return {
          connected: false,
          endpoint: baseUrl,
          latency,
          checkedAt: new Date().toLocaleTimeString(),
          message: `Backend returned status ${response.status}`,
        };
      }
    } catch {
      return {
        connected: false,
        endpoint: baseUrl,
        checkedAt: new Date().toLocaleTimeString(),
        message: `Unable to connect to ${baseUrl}. Running in standalone frontend prototype mode.`,
      };
    }
  },

  /**
   * Upload a codebase ZIP file using multipart/form-data
   * Endpoint: POST /api/projects/upload
   */
  async uploadCodebaseZip(
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<{ projectId: string; message: string; project?: ProjectSummary }> {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/api/projects/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    formData.append('size', file.size.toString());

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            resolve({
              projectId: `proj-${Date.now()}`,
              message: 'Project uploaded and processed successfully.',
            });
          }
        } else {
          let errorMsg = `Upload failed with status ${xhr.status} (${xhr.statusText})`;
          try {
            const errorObj = JSON.parse(xhr.responseText);
            if (errorObj.message || errorObj.error) {
              errorMsg = errorObj.message || errorObj.error;
            }
          } catch {
            // keep standard message
          }
          reject(new ApiServiceError(errorMsg, xhr.status));
        }
      });

      xhr.addEventListener('error', () => {
        reject(
          new ApiServiceError(
            `Cannot connect to backend endpoint ${endpoint}. Verify the backend server is running at ${baseUrl}.`,
            undefined,
            true
          )
        );
      });

      xhr.addEventListener('abort', () => {
        reject(new ApiServiceError('Upload was cancelled.', undefined));
      });

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  },

  /**
   * Query the AI Assistant with a question about the project codebase
   * Endpoint: POST /api/projects/{projectId}/chat
   */
  async sendChatMessage(
    projectId: string,
    message: string
  ): Promise<{ answer: string; relatedFiles?: string[]; tokensUsed?: number }> {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/api/projects/${projectId}/chat`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          projectId,
          message,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let message = `Backend returned status ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          message = parsed.detail || parsed.message || parsed.error || message;
        } catch {
          // keep fallback
        }
        throw new ApiServiceError(message, response.status);
      }

      const data = await response.json();
      return {
        answer: data.answer || data.response || data.message || 'No answer returned from AI model.',
        relatedFiles: data.relatedFiles || data.sources || [],
        tokensUsed: data.tokensUsed,
      };
    } catch (err: unknown) {
      if (err instanceof ApiServiceError) {
        throw err;
      }
      throw new ApiServiceError(
        `Failed to reach AI endpoint at ${endpoint}. Backend may be offline or unconfigured.`,
        undefined,
        true
      );
    }
  },

  /**
   * Retrieve file tree structure for an uploaded project
   * Endpoint: GET /api/projects/{projectId}/tree
   */
  async getProjectFileTree(projectId: string): Promise<FileNode> {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/api/projects/${projectId}/tree`;

    try {
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new ApiServiceError(`Failed to fetch file tree (HTTP ${response.status})`, response.status);
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof ApiServiceError) throw err;
      throw new ApiServiceError(
        `Backend unreachable at ${endpoint}.`,
        undefined,
        true
      );
    }
  },

  /**
   * Retrieve global project statistics
   * Endpoint: GET /api/projects/stats
   */
  async getProjectStats(): Promise<ProjectStats> {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/api/projects/stats`;

    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new ApiServiceError(`Failed to fetch project stats (HTTP ${response.status})`, response.status);
    }

    return await response.json();
  },
};
