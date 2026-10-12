'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatsGrid } from '@/components/StatsGrid';
import { UploadZone } from '@/components/UploadZone';
import { FileExplorer } from '@/components/FileExplorer';
import { AIChat } from '@/components/AIChat';
import { RecentProjects } from '@/components/RecentProjects';
import { SettingsView } from '@/components/SettingsView';
import { apiService } from '@/services/api';
import { 
  SAMPLE_PROJECT, 
  SAMPLE_FILE_TREE, 
  SAMPLE_PROJECT_STATS, 
  SAMPLE_RECENT_PROJECTS 
} from '@/data/sampleCodebase';
import { 
  BackendHealth, 
  FileNode, 
  ProjectStats, 
  ProjectSummary, 
  ViewMode 
} from '@/types';
import { 
  Sparkles, 
  ArrowRight, 
  FolderGit2, 
  Code2, 
  MessageSquareCode, 
  ShieldCheck, 
  UploadCloud,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(SAMPLE_PROJECT);
  const [fileTree, setFileTree] = useState<FileNode | null>(SAMPLE_FILE_TREE);
  const [isDemoData, setIsDemoData] = useState<boolean>(true);
  const [stats, setStats] = useState<ProjectStats>(SAMPLE_PROJECT_STATS);
  const [projects, setProjects] = useState<ProjectSummary[]>(SAMPLE_RECENT_PROJECTS);
  const [chatInitialQuery, setChatInitialQuery] = useState<string>('');
  const [resetKey, setResetKey] = useState<number>(0);
  const [hasSelectedFile, setHasSelectedFile] = useState<boolean>(false);
  
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({
    connected: false,
    endpoint: apiService.getBaseUrl(),
    message: 'Checking connectivity...',
  });

  const checkHealth = useCallback(async () => {
    const health = await apiService.checkHealth();
    setBackendHealth(health);
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleLoadDemo = () => {
    setActiveProject(SAMPLE_PROJECT);
    setFileTree(SAMPLE_FILE_TREE);
    setIsDemoData(true);
    setProjects(SAMPLE_RECENT_PROJECTS);
    setStats(SAMPLE_PROJECT_STATS);
    setChatInitialQuery('');
    setHasSelectedFile(false);
    setResetKey((prev) => prev + 1);
  };

  const handleClearProject = () => {
    setActiveProject(null);
    setFileTree(null);
    setIsDemoData(false);
    setChatInitialQuery('');
    setHasSelectedFile(false);
    setResetKey((prev) => prev + 1);
  };

  const handleProjectUploaded = (newProject: ProjectSummary) => {
    setActiveProject(newProject);
    setProjects((prev) => [newProject, ...prev]);
    setIsDemoData(false);
    setHasSelectedFile(false);
    // Switch to file explorer to show project structure
    setCurrentView('explorer');
  };

  const handleAskAboutFile = (filePath: string) => {
    setChatInitialQuery(`Explain the logic and architecture of ${filePath}`);
    setCurrentView('chat');
  };

  const handleSelectRecentProject = (project: ProjectSummary, targetView: 'explorer' | 'chat') => {
    setActiveProject(project);
    if (project.id === SAMPLE_PROJECT.id) {
      setFileTree(SAMPLE_FILE_TREE);
      setIsDemoData(true);
    }
    setCurrentView(targetView);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* Fixed Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          if (view !== 'chat') setChatInitialQuery('');
          setCurrentView(view);
        }}
        backendHealth={backendHealth}
        onRefreshHealth={checkHealth}
        projectCount={projects.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#090d16]">
        {/* Top Navbar */}
        <Header
          currentView={currentView}
          activeProject={activeProject}
          backendHealth={backendHealth}
          onLoadDemoProject={handleLoadDemo}
          onClearProject={handleClearProject}
          onOpenSettings={() => setCurrentView('settings')}
          canReset={Boolean(activeProject || hasSelectedFile || isDemoData)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Welcome Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-violet-950/40 via-blue-950/20 to-slate-900 border border-violet-800/40 p-6 md:p-8 relative overflow-hidden shadow-sm">
                <div className="relative z-10 max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>DevMind AI • College Mini Project Prototype</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                    Understand Complex Codebases in Seconds
                  </h1>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    Upload any zipped software repository to extract file hierarchies, map architectural dependencies, and query codebase logic with contextual intelligence.
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => setCurrentView('explorer')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-900/30"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>Explore Active Codebase</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentView('chat')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-all"
                    >
                      <MessageSquareCode className="w-4 h-4 text-violet-400" />
                      <span>Ask AI Assistant</span>
                    </button>
                  </div>
                </div>

                {/* Subtle decorative background graphic */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-gradient-to-l from-violet-500 to-transparent pointer-events-none" />
              </div>

              {/* Statistics Grid */}
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                  System Metrics & Vectors
                </h2>
                <StatsGrid stats={stats} />
              </div>

              {/* Upload Zone */}
              <UploadZone
                key={`upload-${resetKey}`}
                resetSignal={resetKey}
                onFileChange={setHasSelectedFile}
                onProjectUploaded={handleProjectUploaded}
                onLoadDemoRequested={handleLoadDemo}
              />

              {/* Recent Projects Table */}
              <RecentProjects
                projects={projects}
                onSelectProject={handleSelectRecentProject}
                onLoadDemoProject={handleLoadDemo}
              />
            </div>
          )}

          {/* VIEW: MY PROJECTS */}
          {currentView === 'projects' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-violet-400" />
                    <span>My Indexed Repositories</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage and inspect uploaded codebases indexed for AI vector retrieval
                  </p>
                </div>
                <button
                  onClick={handleLoadDemo}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reload Demo Repositories</span>
                </button>
              </div>

              <RecentProjects
                projects={projects}
                onSelectProject={handleSelectRecentProject}
                onLoadDemoProject={handleLoadDemo}
              />
            </div>
          )}

          {/* VIEW: FILE EXPLORER */}
          {currentView === 'explorer' && (
            <div className="max-w-7xl mx-auto space-y-4">
              <FileExplorer
                key={`explorer-${resetKey}`}
                resetSignal={resetKey}
                project={activeProject}
                fileTree={fileTree}
                isDemoData={isDemoData}
                onAskAboutFile={handleAskAboutFile}
                onLoadDemoProject={handleLoadDemo}
              />
            </div>
          )}

          {/* VIEW: AI ASSISTANT CHAT */}
          {currentView === 'chat' && (
            <div className="max-w-5xl mx-auto">
              <AIChat
                key={`chat-${resetKey}`}
                resetSignal={resetKey}
                activeProject={activeProject}
                onSelectFile={(filePath) => {
                  setCurrentView('explorer');
                }}
                initialQuery={chatInitialQuery}
              />
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && (
            <SettingsView
              backendHealth={backendHealth}
              onRefreshHealth={checkHealth}
            />
          )}
        </main>
      </div>
    </div>
  );
}
