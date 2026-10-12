'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileArchive, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  Info
} from 'lucide-react';
import { apiService, ApiServiceError } from '@/services/api';
import { ProjectSummary, UploadProgressState } from '@/types';

interface UploadZoneProps {
  onProjectUploaded: (project: ProjectSummary) => void;
  onLoadDemoRequested: () => void;
  resetSignal?: number;
  onFileChange?: (hasFile: boolean) => void;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB limit

export const UploadZone: React.FC<UploadZoneProps> = ({
  onProjectUploaded,
  onLoadDemoRequested,
  resetSignal,
  onFileChange,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<UploadProgressState>({
    file: null,
    status: 'idle',
    progress: 0,
  });
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watch for external reset signal to clear all local upload state
  React.useEffect(() => {
    if (resetSignal) {
      handleReset();
    }
  }, [resetSignal]);

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const isZipExtension = file.name.toLowerCase().endsWith('.zip');
    const isZipMime = file.type === 'application/zip' || 
                      file.type === 'application/x-zip-compressed' || 
                      file.type === 'application/x-zip' || 
                      file.type === ''; // Some browsers leave MIME empty for zip

    if (!isZipExtension && !isZipMime) {
      return {
        valid: false,
        error: `Invalid file format "${file.name}". DevMind AI only accepts compressed ZIP archives (.zip).`,
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 50 MB.`,
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'The selected ZIP file appears to be empty (0 bytes).',
      };
    }

    return { valid: true };
  };

  const handleSelectedFile = (file: File) => {
    setOfflineNotice(null);
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadState({
        file: null,
        status: 'error',
        progress: 0,
        error: validation.error,
      });
      onFileChange?.(false);
      return;
    }

    setUploadState({
      file,
      status: 'idle',
      progress: 0,
      error: undefined,
    });
    onFileChange?.(true);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setUploadState({
      file: null,
      status: 'idle',
      progress: 0,
      error: undefined,
    });
    setOfflineNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileChange?.(false);
  };

  const handleUploadSubmit = async () => {
    if (!uploadState.file) return;

    setUploadState((prev) => ({ ...prev, status: 'uploading', progress: 10 }));
    setOfflineNotice(null);

    try {
      const response = await apiService.uploadCodebaseZip(
        uploadState.file,
        (percentage) => {
          setUploadState((prev) => ({
            ...prev,
            progress: Math.min(percentage, 95),
          }));
        }
      );

      // Backend succeeded
      setUploadState((prev) => ({
        ...prev,
        status: 'completed',
        progress: 100,
        uploadedProjectId: response.projectId,
      }));

      const newProject: ProjectSummary = response.project || {
        id: response.projectId,
        name: uploadState.file.name.replace(/\.zip$/i, ''),
        description: 'Uploaded codebase archive processed by DevMind backend',
        uploadedAt: 'Just now',
        fileCount: 0,
        totalSize: formatBytes(uploadState.file.size),
        status: 'indexed',
        primaryLanguage: 'Codebase',
        tags: ['ZIP Ingested'],
      };

      onProjectUploaded(newProject);
    } catch (err: unknown) {
      const apiError = err as ApiServiceError;
      setUploadState((prev) => ({
        ...prev,
        status: 'error',
        progress: 0,
        error: apiError.message,
      }));

      // Explicitly explain that file is preserved locally without pretending backend succeeded
      setOfflineNotice(
        `Backend server at ${apiService.getBaseUrl()} is currently offline or did not accept the request. DevMind AI has preserved your file "${uploadState.file.name}" locally. For demonstration without a running backend, click "Explore Demo Codebase".`
      );
    }
  };

  return (
    <div className="rounded-xl bg-[#0f172a]/80 border border-slate-800/90 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Ingest Codebase Archive</span>
          </h2>
          <p className="text-xs text-slate-400">
            Upload a zipped repository to parse AST symbols, extract dependencies, and generate vector embeddings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            handleReset();
            onLoadDemoRequested();
          }}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 border border-violet-500/30 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Need sample data? Load Demo</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      {!uploadState.file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-violet-500 bg-violet-950/20 shadow-inner'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={handleChange}
          />
          <div className="w-12 h-12 mx-auto rounded-xl bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 mb-3 group-hover:scale-105 transition-transform">
            <FileArchive className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-200 mb-1">
            Drag and drop your project <span className="text-violet-400 font-semibold">.ZIP</span> archive here
          </p>
          <p className="text-xs text-slate-400 mb-3">
            or <span className="text-violet-400 underline underline-offset-2">browse files</span> on your computer
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/60 font-mono">
              Format: .zip only
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/60 font-mono">
              Max size: 50 MB
            </span>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-950 border border-violet-800/60 flex items-center justify-center text-violet-400 shrink-0">
                <FileArchive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white break-all">
                  {uploadState.file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono">{formatBytes(uploadState.file.size)}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Valid ZIP Archive</span>
                </div>
              </div>
            </div>

            {uploadState.status !== 'uploading' && (
              <button
                onClick={handleReset}
                title="Remove selected archive"
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress Bar (Visible during upload) */}
          {uploadState.status === 'uploading' && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-violet-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Streaming archive to {apiService.getBaseUrl()}...
                </span>
                <span className="font-mono font-medium text-violet-400">
                  {uploadState.progress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Target endpoint: <code className="text-slate-300 font-mono">POST /api/projects/upload</code>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={uploadState.status === 'uploading'}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={uploadState.status === 'uploading'}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-900/40 disabled:opacity-50"
              >
                {uploadState.status === 'uploading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span>Upload to Backend</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation or Upload Error State */}
      {uploadState.error && (
        <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-200">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-300">Upload Validation Notice</p>
            <p className="text-red-200/90 leading-relaxed">{uploadState.error}</p>
          </div>
        </div>
      )}

      {/* Explicit Backend Offline Disclaimer (Never fakes success) */}
      {offlineNotice && (
        <div className="mt-3 p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-start gap-3 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-amber-300">Backend Communication Status:</span>{' '}
              <span>{offlineNotice}</span>
            </div>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onLoadDemoRequested();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-medium text-xs transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Explore Demo Codebase Instead</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
