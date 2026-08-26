import React, { useState } from 'react';
import { AggregateStats, SurveyResponse } from '../types';
import { storageService } from '../services/storage';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  MessageSquare,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';

interface AnalyticsDashboardProps {
  stats: AggregateStats | null;
  responses: SurveyResponse[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenReport: () => void;
}

const DEPT_COLORS = [
  '#059669', // emerald-600
  '#2563eb', // blue-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
  '#0891b2', // cyan-600
  '#ea580c', // orange-600
  '#4f46e5', // indigo-600
  '#65a30d', // lime-600
  '#64748b', // slate-500
  '#0d9488', // teal-600
  '#e11d48'  // rose-600
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  stats,
  responses,
  isLoading,
  onRefresh,
  onOpenReport
}) => {
  const [feedbackTab, setFeedbackTab] = useState<'all' | 'q10' | 'q11' | 'q12'>('all');
  const [searchDept, setSearchDept] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSyncSheets = async () => {
    setIsSyncing(true);
    try {
      const res = await storageService.syncFromGoogleSheets();
      setSyncMsg(res.message);
      onRefresh();
      setTimeout(() => setSyncMsg(null), 4000);
    } catch (err: any) {
      setSyncMsg(`⚠️ 同步失敗：${err?.message || '請確認試算表連線'}`);
      setTimeout(() => setSyncMsg(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickSeed = async () => {
    try {
      await storageService.seedMockResponses();
      onRefresh();
    } catch (e) {}
  };

  if (isLoading && !stats) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-stone-200">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-stone-700">正在自伺服器中央統一資料庫彙總數據中...</p>
      </div>
    );
  }

  if (!stats || stats.totalCount === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-stone-200 space-y-4 max-w-xl mx-auto">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
          📊
        </div>
        <h3 className="text-lg font-black text-stone-800">目前中央統一資料庫尚無問卷填答資料</h3>
        <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
          同仁若已在 Google 試算表中填報資料，請點擊下方<b>「從 Google 試算表同步資料」</b>按鈕直接抓取；或可填寫問卷或產生示範數據。
        </p>

        {syncMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold p-3 rounded-xl">
            {syncMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={handleSyncSheets}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? '正在自試算表同步中...' : '🔄 從 Google 試算表同步資料'}</span>
          </button>

          <button
            onClick={handleQuickSeed}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 border border-stone-300 transition"
          >
            <span>➕ 產生 5 筆示範數據</span>
          </button>
        </div>
      </div>
    );
  }

  // Filter feedback
  const filteredResponses = responses.filter((r) => {
    if (searchDept !== 'all' && r.dept !== searchDept) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.dept.toLowerCase().includes(term) ||
      r.q10.toLowerCase().includes(term) ||
      r.q11.toLowerCase().includes(term) ||
      r.q12.toLowerCase().includes(term)
    );
  });

  // Export CSV
  const handleExportCSV = () => {
    window.location.href = '/api/export-csv';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Central Real-Time Analytics
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            📊 全所研習滿意度即時彙總儀表板
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            數據來源：苗栗縣三義鄉公所 伺服器中央統一資料庫（跨同仁與裝置即時累計）
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncSheets}
            disabled={isSyncing || isLoading}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-300 transition"
            title="從 Google 試算表抓取最新問卷資料"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? '同步中...' : '🔄 同步 Google 試算表'}</span>
          </button>

          <button
            id="refresh-stats-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-stone-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>重新整理</span>
          </button>

          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>匯出 Excel / CSV</span>
          </button>

          <button
            id="open-executive-report-btn"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black px-3.5 py-2.5 rounded-xl shadow transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>產出成果報告摘要</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-1">
            <span>全所填答總份數</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
            {stats.totalCount} <span className="text-xs font-normal text-stone-500">份</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            跨課室全員即時連線
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-1">
            <span>全體總平均滿意度</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {stats.avgOverall} <span className="text-xs font-normal text-stone-500">/ 5.0</span>
          </div>
          <div className="text-[11px] font-bold text-amber-700 mt-1">
            {stats.avgOverall >= 4.5 ? '⭐️⭐️⭐️⭐️⭐️ 極優' : '⭐️⭐️⭐️⭐️ 優良'}
          </div>
        </div>

        {/* Part 2: Course Utility */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-1">
            <span>課程實用性均分</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              Q3-Q6
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {stats.avgPart2} <span className="text-xs font-normal text-stone-500">/ 5.0</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">心理急救與調適技巧</div>
        </div>

        {/* Part 3: Lecturer */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-1">
            <span>講師專業授課均分</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              Q7-Q9
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {stats.avgPart3} <span className="text-xs font-normal text-stone-500">/ 5.0</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">張朝翔 職能治療師</div>
        </div>

        {/* Satisfaction Rate */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-1">
            <span>滿意度達成率 (≥4分)</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
            {stats.satisfactionRate}%
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            達標（公務EAP標準 80%）
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart: Question Averages (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900">
                📈 各問卷題目項目滿意度均分 (1 ~ 5 分)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                包含課程實用度、身心減壓效果與講師專業評鑑
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              滿分 5.0
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.questionAverages}
                margin={{ top: 15, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  angle={-20}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: '#4b5563' }}
                  interval={0}
                />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#4b5563' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <div className="font-bold text-amber-300">{data.label}</div>
                          <div>類別：{data.category}</div>
                          <div className="text-emerald-400 font-bold text-sm">
                            全所均分：{data.avg} 分
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={4.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '高滿意基準 4.0', fill: '#d97706', fontSize: 10 }} />
                <Bar
                  dataKey="avg"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  name="平均得分"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Department Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900">
                🏛️ 各課室同仁填答佔比分佈
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">全所各單位參與踴躍度彙總</p>
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {stats.departmentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.departmentBreakdown}
                    dataKey="count"
                    nameKey="dept"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {stats.departmentBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DEPT_COLORS[index % DEPT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-stone-900 text-white p-2.5 rounded-xl text-xs space-y-0.5">
                            <div className="font-bold text-amber-300">{d.dept}</div>
                            <div>填答筆數：{d.count} 筆 ({d.percentage}%)</div>
                            <div>該單位總均分：{d.avgOverall} 分</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-stone-400">尚無分佈資料</p>
            )}
          </div>
        </div>
      </div>

      {/* Score Breakdown Bars */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200 space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-stone-900">
          ⭐ 滿意度星級評分人數分佈
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {stats.scoreDistribution.map((item) => (
            <div
              key={item.score}
              className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-center"
            >
              <div className="text-xs font-bold text-stone-700">{item.label}</div>
              <div className="text-xl font-black text-emerald-800 mt-1 font-mono">
                {item.count} <span className="text-xs font-normal text-stone-500">人</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-stone-500 font-semibold mt-1">
                佔比 {item.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open-Ended Feedback Wall */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <MessageSquare className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900">
                💬 全所同仁開放式心得、改進建議與期待主題
              </h3>
              <p className="text-xs text-stone-500">
                共彙整 {filteredResponses.length} 筆同仁反饋意見
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category tabs */}
            <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFeedbackTab('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  feedbackTab === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600'
                }`}
              >
                全部意見
              </button>
              <button
                onClick={() => setFeedbackTab('q10')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  feedbackTab === 'q10' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600'
                }`}
              >
                Q10 收穫心得
              </button>
              <button
                onClick={() => setFeedbackTab('q11')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  feedbackTab === 'q11' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600'
                }`}
              >
                Q11 改進建議
              </button>
              <button
                onClick={() => setFeedbackTab('q12')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  feedbackTab === 'q12' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600'
                }`}
              >
                Q12 期待主題
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜尋課室或關鍵字..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 pl-7 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2.5" />
            </div>
          </div>
        </div>

        {/* Feedback Cards Masonry / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[480px] overflow-y-auto pr-1">
          {filteredResponses.length > 0 ? (
            filteredResponses.map((r, idx) => (
              <div
                key={r.id || idx}
                className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2.5 text-xs text-stone-700 hover:border-emerald-300 transition"
              >
                <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                  <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                    {r.dept}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">{r.time}</span>
                </div>

                {(feedbackTab === 'all' || feedbackTab === 'q10') && (
                  <div>
                    <div className="text-[11px] font-bold text-emerald-900 mb-0.5">
                      💡 最大收穫或心得：
                    </div>
                    <p className="text-stone-700 leading-relaxed bg-white p-2 rounded-lg border border-stone-200/80">
                      {r.q10}
                    </p>
                  </div>
                )}

                {(feedbackTab === 'all' || feedbackTab === 'q11') && (
                  <div>
                    <div className="text-[11px] font-bold text-amber-900 mb-0.5">
                      🛠️ 研習安排改進建議：
                    </div>
                    <p className="text-stone-700 leading-relaxed bg-white p-2 rounded-lg border border-stone-200/80">
                      {r.q11}
                    </p>
                  </div>
                )}

                {(feedbackTab === 'all' || feedbackTab === 'q12') && (
                  <div>
                    <div className="text-[11px] font-bold text-purple-900 mb-0.5">
                      🎯 未來期待 EAP 講座：
                    </div>
                    <p className="text-stone-700 leading-relaxed bg-white p-2 rounded-lg border border-stone-200/80">
                      {r.q12}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-stone-400">
              無符合篩選條件的同仁意見
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
