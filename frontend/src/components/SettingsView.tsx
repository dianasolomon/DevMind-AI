'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Terminal, 
  ShieldCheck, 
  FileCode, 
  Cpu, 
  Database,
  Info
} from 'lucide-react';
import { apiService } from '@/services/api';
import { BackendHealth } from '@/types';

interface SettingsViewProps {
  backendHealth: BackendHealth;
  onRefreshHealth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  backendHealth,
  onRefreshHealth,
}) => {
  const [customUrl, setCustomUrl] = useState(apiService.getBaseUrl());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const handleSaveUrl = () => {
    apiService.setBaseUrlOverride(customUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onRefreshHealth();
  };

  const handleResetDefault = () => {
    apiService.setBaseUrlOverride(null);
    setCustomUrl(apiService.getBaseUrl());
    onRefreshHealth();
  };

  const handlePing = async () => {
    setIsPinging(true);
    await onRefreshHealth();
    setTimeout(() => setIsPinging(false), 500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-400" />
          <span>System Architecture & API Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure API endpoints, inspect live backend connectivity, and review team evaluation specifications.
        </p>
      </div>

      {/* Backend API Configuration Card */}
      <div className="rounded-xl bg-[#0f172a]/80 border border-slate-800/90 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Backend Connection Endpoint</h3>
              <p className="text-xs text-slate-400">
                Environment: <code className="text-slate-300 font-mono">NEXT_PUBLIC_API_BASE_URL</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePing}
              disabled={isPinging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>Test Ping</span>
            </button>
          </div>
        </div>

        {/* Input & Save */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300">
            API Base URL (FastAPI / Express Backend)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500/80"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Endpoint</span>
              </button>
              <button
                onClick={handleResetDefault}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                Reset Default
              </button>
            </div>
          </div>
          {saveSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              API base URL saved successfully.
            </p>
          )}
        </div>

        {/* Health status banner */}
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
            backendHealth.connected
              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
              : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
          }`}
        >
          {backendHealth.connected ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {backendHealth.connected ? 'Connected to Backend Service' : 'Standalone Frontend Demo Mode'}
              </span>
              {backendHealth.latency && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-300">
                  {backendHealth.latency}ms
                </span>
              )}
            </div>
            <p className="opacity-90 leading-relaxed">{backendHealth.message}</p>
          </div>
        </div>
      </div>

      {/* College Mini Project Evaluation Scope Card */}
      <div className="rounded-xl bg-[#0f172a]/80 border border-slate-800/90 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">
            Mid-Term Evaluation: Division of Responsibilities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Person 1 Box */}
          <div className="rounded-lg bg-slate-900/90 border border-violet-800/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-violet-300 uppercase tracking-wider text-[11px]">
                Person 1: Frontend Development
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Active Prototype
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-xs">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Next.js App Router & Tailwind CSS dark theme</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Modular components: Dashboard, Explorer, AIChat</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Strict ZIP drag-and-drop validation & progress UI</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Isolated API service layer with NEXT_PUBLIC_API_BASE_URL</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Honest offline demo states (no fake LLM/backend claims)</span>
              </li>
            </ul>
          </div>

          {/* Person 2 Box */}
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Person 2: Backend & AI Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/60">
                In Parallel Dev
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Unzip & AST parsing: <code className="text-slate-300 font-mono">POST /api/projects/upload</code></span>
              </li>
              <li className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Vector embeddings & chunk indexing</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>RAG query QA pipeline: <code className="text-slate-300 font-mono">POST /api/projects/:id/chat</code></span>
              </li>
              <li className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>JSON tree endpoint: <code className="text-slate-300 font-mono">GET /api/projects/:id/tree</code></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
