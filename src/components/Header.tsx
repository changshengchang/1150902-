import React from 'react';
import { ClipboardList, BarChart3, BookOpen, QrCode, Lock, Database, Cloud } from 'lucide-react';

interface HeaderProps {
  activeTab: 'survey' | 'analytics' | 'plan' | 'share' | 'admin';
  setActiveTab: (tab: 'survey' | 'analytics' | 'plan' | 'share' | 'admin') => void;
  totalResponses: number;
  dbEngine?: { label: string; mode: string; isCloud: boolean };
  onOpenCloudGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalResponses,
  dbEngine = { label: '中央統一資料庫', mode: 'api', isCloud: true },
  onOpenCloudGuide
}) => {
  return (
    <header className="bg-emerald-900 text-white shadow-lg sticky top-0 z-40 border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Title & Official Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm shadow-md ring-2 ring-amber-400/40">
              EAP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 border border-emerald-700">
                  115年度專案
                </span>
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  苗栗縣三義鄉公所 員工協助方案
                </h1>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                「職場心理健康急救與自我調適」講座滿意度調查
              </p>
            </div>
          </div>

          {/* Mobile DB Badge */}
          <button
            onClick={onOpenCloudGuide}
            className="md:hidden flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1 rounded-full text-[11px] border border-emerald-700/60"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono font-bold text-emerald-300">{totalResponses} 筆</span>
          </button>
        </div>

        {/* Navigation & Central DB Live Status */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-center md:justify-end">
          {/* Live DB Status (Desktop) */}
          <button
            id="header-db-indicator"
            onClick={onOpenCloudGuide}
            className="hidden lg:flex items-center gap-2 bg-emerald-950/80 hover:bg-emerald-950 px-3 py-1.5 rounded-xl text-xs border border-emerald-700/70 transition"
            title={`${dbEngine.label}（點擊查看雲端設定與 Vercel 佈署說明）`}
          >
            {dbEngine.isCloud ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Database className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-emerald-200 font-medium">{dbEngine.label}：</span>
            <span className="flex items-center gap-1 font-bold text-amber-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {totalResponses} 筆已彙總
            </span>
          </button>

          {/* Tab Navigation */}
          <nav className="flex flex-wrap gap-1 bg-emerald-950/70 p-1 rounded-xl border border-emerald-800/80 text-xs">
            <button
              id="tab-survey-btn"
              onClick={() => setActiveTab('survey')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'survey'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>問卷填答</span>
            </button>

            <button
              id="tab-analytics-btn"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>統計分析儀表板</span>
            </button>

            <button
              id="tab-plan-btn"
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'plan'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>研習計畫</span>
            </button>

            <button
              id="tab-share-btn"
              onClick={() => setActiveTab('share')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'share'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>投影分享</span>
            </button>

            <button
              id="tab-admin-btn"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                  : 'text-amber-300 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>管理後台</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
