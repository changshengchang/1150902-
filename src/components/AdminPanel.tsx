import React, { useState } from 'react';
import { SurveyResponse, AggregateStats } from '../types';
import { DEPARTMENTS, QUESTIONS } from '../data/questions';
import {
  Lock,
  Unlock,
  Trash2,
  Download,
  PlusCircle,
  Eye,
  Search,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  RefreshCw,
  LogOut,
  X
} from 'lucide-react';

interface AdminPanelProps {
  responses: SurveyResponse[];
  stats: AggregateStats | null;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenReport: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  responses,
  stats,
  isLoading,
  onRefresh,
  onOpenReport
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('changshengchanggail@gmail.com');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Search & filter state
  const [searchDept, setSearchDept] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  // Confirm delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (password === 'nick620504' || password === 'admin888') {
      setIsAuthenticated(true);
      showToast('✅ 管理員登入成功！已解鎖伺服器中央統一資料庫後台');
    } else {
      setAuthError('解鎖密碼不正確！預設密碼為 nick620504');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  // Generate 5 mock seed responses on server
  const handleGenerateSeed = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        onRefresh();
        showToast('✅ 已成功自伺服器新增 5 筆示範問卷資料！');
      }
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete single response
  const handleDeleteSingle = async () => {
    if (!deleteTargetId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/responses/${deleteTargetId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeleteTargetId(null);
        if (selectedResponse?.id === deleteTargetId) {
          setSelectedResponse(null);
        }
        onRefresh();
        showToast('🗑️ 已成功從中央資料庫刪除該筆問卷紀錄');
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Clear all responses
  const handleClearAll = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/responses', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setShowClearAllModal(false);
        onRefresh();
        showToast('🗑️ 已成功清空中央資料庫所有問卷紀錄');
      }
    } catch (err) {
      console.error('Clear all error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.location.href = '/api/export-csv';
  };

  // Filtered responses list
  const filtered = responses.filter((r) => {
    if (searchDept !== 'all' && r.dept !== searchDept) return false;
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      r.dept.toLowerCase().includes(kw) ||
      r.time.toLowerCase().includes(kw) ||
      r.q10.toLowerCase().includes(kw) ||
      r.q11.toLowerCase().includes(kw) ||
      r.q12.toLowerCase().includes(kw)
    );
  });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-stone-200 text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-emerald-700" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 mb-1">
            🔐 管理者授權驗證
          </h2>
          <p className="text-xs text-stone-500 mb-6 leading-relaxed">
            請輸入管理密碼以檢視苗栗縣三義鄉公所中央資料庫明細、維護紀錄與匯出報表
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                管理員帳號 (選填)
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="請輸入管理員帳號"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs sm:text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                解鎖密碼 (必填)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入解鎖密碼 (nick620504)"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs sm:text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {authError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              id="admin-login-submit-btn"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>驗證並開啟中央資料庫管理後台</span>
            </button>
          </form>

          {/* Quick password filler */}
          <div className="mt-6 pt-4 border-t border-stone-200 text-xs text-stone-500 flex items-center justify-center gap-2">
            <span>預設管理密碼：</span>
            <button
              type="button"
              onClick={() => setPassword('nick620504')}
              className="font-mono font-bold text-emerald-700 underline hover:text-emerald-900"
            >
              nick620504 (點此快速帶入)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce border border-emerald-500">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Status Bar */}
      <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-md border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 border border-emerald-700 flex items-center justify-center text-lg shadow-inner">
            🔥
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-emerald-200">
                登入管理員：
                <span className="font-mono font-bold text-white ml-1">{adminEmail}</span>
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                🟢 伺服器中央統一資料庫連線中
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black mt-0.5">
              苗栗縣三義鄉公所 115年度 EAP 問卷中央資料庫管理系統
            </h3>
          </div>
        </div>

        {/* Global Admin Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black px-3.5 py-2 rounded-xl shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出 Excel / CSV (含 UTF-8 BOM)</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>成果報告摘要</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-emerald-950 hover:bg-emerald-800 text-stone-300 hover:text-white text-xs px-3 py-2 rounded-xl border border-emerald-700 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200 space-y-4">
        {/* Table Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <h4 className="text-base font-black text-stone-900">
              📋 全所同仁問卷填答明細列表（中央資料庫即時連線）
            </h4>
            <p className="text-xs text-stone-500">
              目前中央資料庫累積共 <b className="text-emerald-800 font-mono">{responses.length}</b> 筆資料
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateSeed}
              disabled={actionLoading}
              className="flex items-center gap-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-xl border border-stone-300 font-bold transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>➕ 產生 5 筆測試資料</span>
            </button>

            <button
              onClick={() => setShowClearAllModal(true)}
              disabled={actionLoading || responses.length === 0}
              className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-bold shadow transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空中央資料庫</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700">課室篩選：</span>
            <select
              value={searchDept}
              onChange={(e) => setSearchDept(e.target.value)}
              className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">全部課室 ({responses.length})</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="搜尋關鍵字（課室、時間、心得建議）..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1 text-xs text-stone-800 pl-7 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2" />
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1 bg-white hover:bg-stone-100 text-stone-700 px-3 py-1 rounded-lg border border-stone-300 font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>重新整理</span>
          </button>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                <th className="p-3 w-16 text-center">序號</th>
                <th className="p-3 w-36">填答時間</th>
                <th className="p-3 w-28">服務單位</th>
                <th className="p-3 w-20 text-center">總均分</th>
                <th className="p-3 w-28 text-center">課程/講師均分</th>
                <th className="p-3">開放式心得與建議摘要</th>
                <th className="p-3 w-28 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.length > 0 ? (
                filtered.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-stone-50/80 transition">
                    <td className="p-3 text-center font-mono font-bold text-stone-500">
                      #{responses.length - idx}
                    </td>
                    <td className="p-3 font-mono text-stone-600">{r.time}</td>
                    <td className="p-3 font-bold text-stone-900">
                      <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-900 text-xs">
                        {r.dept}
                      </span>
                    </td>
                    <td className="p-3 text-center font-black text-amber-700 font-mono text-sm">
                      {r.avgOverall}
                    </td>
                    <td className="p-3 text-center font-mono text-stone-600">
                      {r.avgPart2} / {r.avgPart3}
                    </td>
                    <td className="p-3 text-stone-600 max-w-xs truncate" title={r.q10}>
                      {r.q10 && r.q10 !== '（無特別填寫）'
                        ? r.q10
                        : r.q11 && r.q11 !== '（無特別填寫）'
                        ? r.q11
                        : r.q12 || '（無特別填寫）'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedResponse(r)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="查看完整各題分數與意見"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(r.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="從中央資料庫刪除此筆"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400 text-xs">
                    目前無符合條件的問卷紀錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                  {selectedResponse.dept}
                </span>
                <h3 className="font-bold text-stone-900 text-base">問卷詳細填答內容</h3>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="bg-stone-50 p-3 rounded-xl space-y-1">
                <div><b>流水號：</b> <span className="font-mono">{selectedResponse.id}</span></div>
                <div><b>填答時間：</b> {selectedResponse.time}</div>
                <div><b>身分別：</b> {selectedResponse.role || '未提供'} ｜ <b>性別：</b> {selectedResponse.gender || '未提供'}</div>
                <div>
                  <b>總體滿意度均分：</b>{' '}
                  <span className="font-bold text-amber-700 text-sm">
                    {selectedResponse.avgOverall} 分
                  </span>
                </div>
              </div>

              {/* Questions Breakdown */}
              <div className="space-y-2">
                <div className="font-bold text-stone-900">各題評分：</div>
                <div className="grid grid-cols-2 gap-2">
                  {QUESTIONS.map((q) => (
                    <div key={q.id} className="bg-stone-50 p-2 rounded-lg border border-stone-200 flex justify-between">
                      <span className="truncate pr-1">{q.num}. {q.shortLabel}</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        {selectedResponse.scores[q.id]} 分
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Open Feedback */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="font-bold text-stone-900">開放式意見：</div>
                <div className="space-y-1.5">
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="font-bold text-emerald-900">Q10 心得收穫：</span>
                    <p className="text-stone-700 mt-0.5">{selectedResponse.q10}</p>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="font-bold text-amber-900">Q11 改進建議：</span>
                    <p className="text-stone-700 mt-0.5">{selectedResponse.q11}</p>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="font-bold text-purple-900">Q12 期待主題：</span>
                    <p className="text-stone-700 mt-0.5">{selectedResponse.q12}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedResponse(null)}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 rounded-xl text-xs transition"
            >
              關閉視窗
            </button>
          </div>
        </div>
      )}

      {/* Delete Single Confirm Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">確認刪除此筆問卷？</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              此操作將自伺服器中央統一資料庫永久移除該筆紀錄，各項統計均分將即時重新計算。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2 rounded-xl text-xs transition"
              >
                取消
              </button>
              <button
                onClick={handleDeleteSingle}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition shadow"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirm Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">確定清空中央資料庫？</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              此操作將刪除伺服器現有的全部 <b>{responses.length}</b> 筆問卷資料，無法復原！
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2 rounded-xl text-xs transition"
              >
                取消返回
              </button>
              <button
                onClick={handleClearAll}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition shadow"
              >
                確認清空全部
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
