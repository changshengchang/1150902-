import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SurveyForm } from './components/SurveyForm';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SeminarPlan } from './components/SeminarPlan';
import { ShareModal } from './components/ShareModal';
import { AdminPanel } from './components/AdminPanel';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { SurveyResponse, AggregateStats } from './types';
import { Shield, PhoneCall, HeartHandshake } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'survey' | 'analytics' | 'plan' | 'share' | 'admin'>('survey');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Fetch all central database records & aggregates
  const fetchData = useCallback(async () => {
    try {
      const [resResponses, resStats] = await Promise.all([
        fetch('/api/responses'),
        fetch('/api/stats')
      ]);

      if (resResponses.ok && resStats.ok) {
        const jsonResponses = await resResponses.json();
        const jsonStats = await resStats.json();

        if (jsonResponses.success && Array.isArray(jsonResponses.data)) {
          setResponses(jsonResponses.data);
        }
        setStats(jsonStats);
        setDbConnected(true);
      }
    } catch (err) {
      console.error('Error fetching unified database data:', err);
      setDbConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Periodic background refresh every 8 seconds so everyone sees real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData();
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleSurveySuccess = (newRecord: SurveyResponse, totalCount: number) => {
    setResponses((prev) => [newRecord, ...prev]);
    fetchData(); // Trigger immediate aggregate recompute
  };

  return (
    <div className="min-h-screen bg-stone-100/90 text-stone-800 flex flex-col font-sans antialiased selection:bg-emerald-200">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalResponses={responses.length}
        dbConnected={dbConnected}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {activeTab === 'survey' && (
          <SurveyForm
            onSuccess={handleSurveySuccess}
            onViewAnalytics={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            stats={stats}
            responses={responses}
            isLoading={isLoading}
            onRefresh={fetchData}
            onOpenReport={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'plan' && <SeminarPlan />}

        {activeTab === 'share' && <ShareModal />}

        {activeTab === 'admin' && (
          <AdminPanel
            responses={responses}
            stats={stats}
            isLoading={isLoading}
            onRefresh={fetchData}
            onOpenReport={() => setIsReportModalOpen(true)}
          />
        )}
      </main>

      {/* Executive Report Printable Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        stats={stats}
        responses={responses}
      />

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 border-t border-stone-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-stone-200 font-bold">
              <HeartHandshake className="w-4 h-4 text-amber-500" />
              <span>苗栗縣三義鄉公所 115年度員工協助方案 (EAP)</span>
            </div>
            <p className="text-stone-500 text-[11px]">
              主辦單位：苗栗縣三義鄉公所人事室 ｜ 合辦單位：苗栗市社區心理衛生中心
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>全所雲端統一資料庫安全加密儲存</span>
            </span>
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
              <span>人事室 EAP 諮詢專線：(037) 872-801</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
