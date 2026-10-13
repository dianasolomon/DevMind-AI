'use client';

import React from 'react';
import { FolderGit2, FileCode, MessageSquareCode, Database, ArrowUpRight } from 'lucide-react';
import { ProjectStats } from '@/types';

interface StatsGridProps {
  stats: ProjectStats;
  isLoading?: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, isLoading = false }) => {
  const cards = [
    {
      title: 'Indexed Projects',
      value: stats.totalProjects,
      description: 'Active software codebases',
      icon: FolderGit2,
      trend: '+1 this week',
      accentColor: 'text-violet-400',
      bgColor: 'bg-violet-950/40 border-violet-800/40',
      iconBg: 'bg-violet-600/15 text-violet-400',
    },
    {
      title: 'Parsed Source Files',
      value: stats.indexedFiles,
      description: 'AST tokens & modules',
      icon: FileCode,
      trend: '+28 modules',
      accentColor: 'text-blue-400',
      bgColor: 'bg-blue-950/40 border-blue-800/40',
      iconBg: 'bg-blue-600/15 text-blue-400',
    },
    {
      title: 'AI Queries Answered',
      value: stats.aiQueriesAnswered,
      description: 'Semantic codebase QA',
      icon: MessageSquareCode,
      trend: '99.4% accuracy',
      accentColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40 border-emerald-800/40',
      iconBg: 'bg-emerald-600/15 text-emerald-400',
    },
    {
      title: 'Vector Context Tokens',
      value: stats.tokensProcessed,
      description: `${stats.storageUsed} vector index size`,
      icon: Database,
      trend: 'Embeddings cached',
      accentColor: 'text-cyan-400',
      bgColor: 'bg-cyan-950/40 border-cyan-800/40',
      iconBg: 'bg-cyan-600/15 text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="rounded-xl bg-[#0f172a]/70 border border-slate-800/80 p-5 hover:border-slate-700/80 transition-all duration-200 shadow-sm relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              {isLoading ? (
                <div className="h-8 w-24 bg-slate-800 animate-pulse rounded my-1" />
              ) : (
                <div className="text-2xl font-bold tracking-tight text-white font-mono">
                  {card.value}
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate max-w-[150px]">{card.description}</span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-0.5">
                  {card.trend}
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </span>
              </div>
            </div>

            {/* Subtle glow on hover */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        );
      })}
    </div>
  );
};
