'use client';

import React from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  FolderGit2, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { BackendHealth, ProjectSummary, ViewMode } from '@/types';

interface HeaderProps {
  currentView: ViewMode;
  activeProject: ProjectSummary | null;
  backendHealth: BackendHealth;
  onLoadDemoProject: () => void;
  onClearProject: () => void;
  onOpenSettings: () => void;
  canReset?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  activeProject,
  backendHealth,
  onLoadDemoProject,
  onClearProject,
  onOpenSettings,
  canReset = false,
}) => {
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Dashboard Overview', subtitle: 'Monitor codebase metrics and ingest new project repositories' };
      case 'projects':
        return { title: 'Indexed Repositories', subtitle: 'Manage software codebases and vector indexes' };
      case 'explorer':
        return { title: 'Codebase File Explorer', subtitle: 'Hierarchical file tree navigation with code inspection' };
      case 'chat':
        return { title: 'AI Codebase Assistant', subtitle: 'Ask architectural questions and query codebase logic' };
      case 'settings':
        return { title: 'System & API Settings', subtitle: 'Configure backend endpoints and environment connectivity' };
      default:
        return { title: 'DevMind AI', subtitle: 'AI Codebase Understanding Assistant' };
    }
  };

  const viewInfo = getViewTitle();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0b101c]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-white tracking-tight">
            {viewInfo.title}
          </h1>
          {activeProject && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-950/80 border border-violet-800/60 text-violet-300">
              <FolderGit2 className="w-3 h-3 text-violet-400" />
              <span>{activeProject.name}</span>
              {activeProject.status === 'sample' && (
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/80 px-1 rounded">
                  Demo
                </span>
              )}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 hidden sm:block">
          {viewInfo.subtitle}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Demo Data Quick Trigger */}
        <button
          onClick={onLoadDemoProject}
          title="Load sample codebase data for quick presentation demo"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600/20 to-blue-600/20 hover:from-violet-600/30 hover:to-blue-600/30 border border-violet-500/40 text-violet-200 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Load Demo Codebase</span>
        </button>

        {(activeProject || canReset) && (
          <button
            onClick={onClearProject}
            title="Reset active project and clear upload state"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset State</span>
          </button>
        )}

        {/* Backend health status badge */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all"
        >
          {backendHealth.connected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden lg:inline">
            {backendHealth.connected ? 'API Ready' : 'API Offline (Demo)'}
          </span>
          <Settings className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
