'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  FileCode2, 
  ChevronRight, 
  ChevronDown, 
  FileJson, 
  FileTerminal,
  FileCog,
  FileBadge,
  Sparkles,
  Search,
  Copy,
  Check,
  MessageSquareCode,
  FolderTree,
  ExternalLink,
  Code,
  X
} from 'lucide-react';
import { FileNode, ProjectSummary } from '@/types';

interface FileExplorerProps {
  project: ProjectSummary | null;
  fileTree: FileNode | null;
  isDemoData: boolean;
  onAskAboutFile: (filePath: string, snippet?: string) => void;
  onLoadDemoProject: () => void;
  resetSignal?: number;
}

/**
 * Recursively filters the file tree by query while preserving parent directories.
 * Performs case-insensitive partial matching on filenames (and paths if a slash is provided).
 */
const filterTree = (node: FileNode, query: string): FileNode | null => {
  const q = query.trim().toLowerCase();
  if (!q) return node;

  const matchesName = node.name.toLowerCase().includes(q);
  const matchesPath = q.includes('/') && node.path.toLowerCase().includes(q);
  const isMatch = matchesName || matchesPath;

  if (node.type === 'directory') {
    const filteredChildren = (node.children || [])
      .map((child) => filterTree(child, query))
      .filter((child): child is FileNode => child !== null);

    // If any descendant matched, keep this directory and its matched children
    if (filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    // If directory itself matches and is not the root wrapper, keep it with its children
    if (isMatch && node.id !== 'root') {
      return {
        ...node,
        children: node.children,
      };
    }

    return null;
  }

  // It's a file
  return isMatch ? node : null;
};

/**
 * Counts total files within a tree structure
 */
const countFiles = (node: FileNode | null): number => {
  if (!node) return 0;
  if (node.type === 'file') return 1;
  return (node.children || []).reduce((acc, child) => acc + countFiles(child), 0);
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  project,
  fileTree,
  isDemoData,
  onAskAboutFile,
  onLoadDemoProject,
  resetSignal,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    src: true,
    'src/controllers': true,
    'src/services': true,
  });
  const [searchExpandedNodes, setSearchExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Clear selected file and search state when tree is cleared or reset signal fires
  useEffect(() => {
    if (!fileTree || resetSignal) {
      setSelectedFile(null);
      setSearchQuery('');
      setSearchExpandedNodes({});
    }
  }, [fileTree, resetSignal]);

  // Reset search-specific expansion overrides whenever search query changes
  useEffect(() => {
    setSearchExpandedNodes({});
  }, [searchQuery]);

  // Compute filtered tree based on active search query
  const filteredTree = useMemo(() => {
    if (!fileTree) return null;
    return filterTree(fileTree, searchQuery);
  }, [fileTree, searchQuery]);

  // Compute total or matching files count
  const matchingFileCount = useMemo(() => {
    if (!searchQuery.trim()) return project?.fileCount || 28;
    return countFiles(filteredTree);
  }, [filteredTree, searchQuery, project?.fileCount]);

  // Determine if a node is currently expanded
  const isNodeExpanded = (nodeId: string): boolean => {
    if (searchQuery.trim()) {
      // During search, default all folders in matching paths to expanded, but allow user toggle
      return searchExpandedNodes[nodeId] ?? true;
    }
    return !!expandedNodes[nodeId];
  };

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    if (searchQuery.trim()) {
      const current = searchExpandedNodes[nodeId] ?? true;
      setSearchExpandedNodes((prev) => ({
        ...prev,
        [nodeId]: !current,
      }));
    } else {
      setExpandedNodes((prev) => ({
        ...prev,
        [nodeId]: !prev[nodeId],
      }));
    }
  };

  // Helper for matching file icons
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') {
      return <FileCode2 className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (ext === 'json') {
      return <FileJson className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (ext === 'md') {
      return <FileBadge className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    if (fileName.startsWith('.env') || ext === 'env') {
      return <FileCog className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (ext === 'sh' || ext === 'bash') {
      return <FileTerminal className="w-4 h-4 text-violet-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recursive tree rendering
  const renderTree = (node: FileNode, depth = 0) => {
    const isExpanded = isNodeExpanded(node.id);
    const isFolder = node.type === 'directory';
    const isSelected = selectedFile?.id === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => {
            if (isFolder) {
              toggleNode(node.id);
            } else {
              setSelectedFile(node);
            }
          }}
          style={{ paddingLeft: `${Math.max(depth * 14 + 10, 10)}px` }}
          className={`flex items-center gap-1.5 py-1.5 pr-3 text-xs rounded-md cursor-pointer transition-colors ${
            isSelected
              ? 'bg-violet-600/20 text-violet-300 font-medium border border-violet-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          {isFolder ? (
            <>
              <span className="text-slate-500 hover:text-slate-300">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-violet-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-violet-400 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5" />
              {getFileIcon(node.name)}
            </>
          )}

          <span className="truncate">{node.name}</span>

          {node.lineCount && !isFolder && (
            <span className="ml-auto text-[10px] text-slate-400 font-mono">
              {node.lineCount}L
            </span>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div className="border-l border-slate-800/60 ml-4">
            {node.children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // If no project is selected or file tree is empty
  if (!fileTree) {
    return (
      <div className="rounded-xl bg-[#0f172a]/70 border border-slate-800/80 p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-950/60 border border-violet-800/40 flex items-center justify-center text-violet-400">
          <FolderTree className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-base font-semibold text-white">No Codebase Loaded in Explorer</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload a repository ZIP archive on the dashboard or inspect DevMind AI&apos;s pre-configured sample codebase to explore hierarchical AST structures.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onLoadDemoProject}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-900/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Sample Repository Data</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Demo Banner Notification if displaying sample data */}
      {isDemoData && (
        <div className="px-3.5 py-2.5 rounded-lg bg-violet-950/40 border border-violet-800/50 flex items-center justify-between text-xs text-violet-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
            <span>
              <strong>Sample Data Mode:</strong> Displaying isolated sample tree for{' '}
              <code className="text-violet-200 font-mono font-bold bg-violet-900/50 px-1 py-0.5 rounded">
                devmind-demo-core
              </code>
              . Designed to be swapped with live API response from <code className="font-mono text-slate-300">GET /api/projects/:id/tree</code>.
            </span>
          </div>
        </div>
      )}

      {/* Main Explorer Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[520px]">
        {/* Left Pane: File Tree */}
        <div className="lg:col-span-4 rounded-xl bg-[#0d1322] border border-slate-800/90 flex flex-col h-full overflow-hidden shadow-sm">
          {/* Header & Search */}
          <div className="p-3 border-b border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-violet-400" />
                <span>Explorer Tree</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {searchQuery.trim() ? `${matchingFileCount} match${matchingFileCount === 1 ? '' : 'es'}` : `${project?.fileCount || 28} files`}
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter files by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
                  title="Clear filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tree Scroll Area */}
          <div className="flex-1 p-2 overflow-y-auto max-h-[600px] space-y-0.5">
            {filteredTree ? (
              renderTree(filteredTree)
            ) : (
              <div className="p-6 text-center space-y-2 text-xs text-slate-400">
                <p>No files matching &ldquo;<span className="text-slate-200 font-mono">{searchQuery}</span>&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-block text-[11px] text-violet-400 hover:text-violet-300 underline underline-offset-2"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: File Code Inspection View */}
        <div className="lg:col-span-8 rounded-xl bg-[#0b0f19] border border-slate-800/90 flex flex-col overflow-hidden shadow-sm">
          {selectedFile ? (
            <>
              {/* Code viewer header */}
              <div className="px-4 py-3 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile.name)}
                  <div>
                    <span className="text-xs font-semibold text-white font-mono">
                      {selectedFile.path}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{selectedFile.language?.toUpperCase() || 'FILE'}</span>
                      <span>•</span>
                      <span>{selectedFile.lineCount || selectedFile.content?.split('\n').length || 0} lines</span>
                      {selectedFile.size && (
                        <>
                          <span>•</span>
                          <span>{selectedFile.size} bytes</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(selectedFile.content || '')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onAskAboutFile(selectedFile.path, selectedFile.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-sm"
                  >
                    <MessageSquareCode className="w-3.5 h-3.5" />
                    <span>Ask AI About File</span>
                  </button>
                </div>
              </div>

              {/* Code Content View */}
              <div className="flex-1 p-4 overflow-x-auto overflow-y-auto max-h-[580px] bg-[#090d16] font-mono text-xs leading-relaxed text-slate-300">
                <pre className="code-container">
                  {selectedFile.content ? (
                    selectedFile.content.split('\n').map((line, idx) => (
                      <div key={idx} className="flex hover:bg-slate-900/60 px-1 rounded">
                        <span className="w-9 text-slate-400 text-right pr-4 select-none shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="whitespace-pre">{line}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 py-8 text-center italic">
                      Binary or unparsed file content. Size: {selectedFile.size || 0} bytes.
                    </div>
                  )}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Select a file from the explorer tree</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click any source file in the left panel to inspect code and query AI context.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
