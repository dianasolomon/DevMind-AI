'use client';

import React from 'react';
import { 
  FolderGit2, 
  Code2, 
  MessageSquareCode, 
  Calendar, 
  HardDrive, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { ProjectSummary } from '@/types';

interface RecentProjectsProps {
  projects: ProjectSummary[];
  onSelectProject: (project: ProjectSummary, view: 'explorer' | 'chat') => void;
  onLoadDemoProject: () => void;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  onSelectProject,
  onLoadDemoProject,
}) => {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl bg-[#0f172a]/70 border border-slate-800/80 p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <FolderGit2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">No Projects Available</h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload a ZIP archive to start indexing or load demo data.
          </p>
        </div>
        <button
          onClick={onLoadDemoProject}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Sample Projects</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#0f172a]/70 border border-slate-800/90 overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-violet-400" />
            <span>Recent Codebase Repositories</span>
          </h2>
          <p className="text-xs text-slate-400">
            Repositories with parsed AST structures, symbol maps, and vector embeddings
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {projects.length} Repositories
        </span>
      </div>

      <div className="divide-y divide-slate-800/70">
        {projects.map((proj) => {
          const isSample = proj.status === 'sample';
          return (
            <div
              key={proj.id}
              className="p-4 sm:p-5 hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-sm text-white hover:text-violet-300 transition-colors cursor-pointer font-mono"
                    onClick={() => onSelectProject(proj, 'explorer')}
                  >
                    {proj.name}
                  </span>

                  {isSample ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/70 text-amber-300 border border-amber-800/50">
                      Sample Data
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/50">
                      Indexed
                    </span>
                  )}

                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    {proj.primaryLanguage}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {proj.description}
                </p>

                {/* Tags and stats */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <HardDrive className="w-3 h-3 text-slate-400" />
                    {proj.totalSize} ({proj.fileCount} files)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {proj.uploadedAt}
                  </span>
                  {proj.branch && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        branch: {proj.branch}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSelectProject(proj, 'explorer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
                >
                  <Code2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>Files</span>
                </button>

                <button
                  onClick={() => onSelectProject(proj, 'chat')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 hover:text-white transition-all"
                >
                  <MessageSquareCode className="w-3.5 h-3.5 text-violet-400" />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
