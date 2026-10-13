'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  FolderGit2, 
  MessageSquareCode, 
  Code2, 
  Settings, 
  Terminal, 
  Cpu, 
  Server,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { BackendHealth, ViewMode } from '@/types';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  backendHealth: BackendHealth;
  onRefreshHealth: () => void;
  projectCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  backendHealth,
  onRefreshHealth,
  projectCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'projects' as ViewMode,
      label: 'My Projects',
      icon: FolderGit2,
      badge: projectCount.toString(),
    },
    {
      id: 'explorer' as ViewMode,
      label: 'File Explorer',
      icon: Code2,
      badge: 'Live',
    },
    {
      id: 'chat' as ViewMode,
      label: 'AI Assistant',
      icon: MessageSquareCode,
      badge: 'Q&A',
    },
    {
      id: 'settings' as ViewMode,
      label: 'Settings & API',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-slate-800/80 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md shadow-violet-900/30 text-white">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">DevMind</span>
              <span className="text-violet-400 font-extrabold text-base">AI</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-violet-950/80 border border-violet-800/50 text-violet-300">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Codebase Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick evaluation helper info */}
        <div className="pt-6 px-3">
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Project Scope</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-white">Person 1: Frontend</strong>. Real API service layer included with transparent offline demo states for mid-term evaluation.
            </p>
          </div>
        </div>
      </nav>

      {/* Backend Connection Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0a0e1a]">
        <div 
          onClick={onRefreshHealth}
          title="Click to re-ping backend endpoint"
          className="cursor-pointer group rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 p-2.5 transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">Backend API</span>
            </div>
            <span className="flex items-center gap-1 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth.connected
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className={backendHealth.connected ? 'text-emerald-400' : 'text-amber-400'}>
                {backendHealth.connected ? 'Connected' : 'Standalone Demo'}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate max-w-[140px] font-mono">{backendHealth.endpoint}</span>
            <span className="text-slate-400 group-hover:text-slate-300">Ping</span>
          </div>
        </div>

        {/* Developer attribution */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>DevMind AI Prototype</span>
          <span className="font-mono text-[10px] text-violet-400">localhost:3000</span>
        </div>
      </div>
    </aside>
  );
};
