import React, { useState, useEffect } from 'react';
import { SurveyResponse, AggregateStats } from '../types';
import { DEPARTMENTS, QUESTIONS } from '../data/questions';
import { storageService } from '../services/storage';
import { getStoredCloudConfig, saveStoredCloudConfig, initCloudConfigFromServer, getShareableSurveyUrl, CloudConfig } from '../services/cloudConfig';
import {
  Lock,
  Unlock,
  Trash2,
  Download,
  Upload,
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
  X,
  Settings,
  Cloud,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  Send,
  Sparkles
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
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin active sub-view
  const [adminSubTab, setAdminSubTab] = useState<'records' | 'cloud_setup'>('records');

  // Search & filter state
  const [searchDept, setSearchDept] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  // Confirm delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cloud Config State
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(getStoredCloudConfig());
  const [sheetsUrl, setSheetsUrl] = useState(cloudConfig.googleSheetsWebhookUrl || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; result: string | null; isSuccess: boolean }>({
    loading: false,
    result: null,
    isSuccess: false
  });

  useEffect(() => {
    initCloudConfigFromServer().then(cfg => {
      setCloudConfig(cfg);
      if (cfg.googleSheetsWebhookUrl) {
        setSheetsUrl(cfg.googleSheetsWebhookUrl);
      }
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (password === 'nick620504' || password === 'admin888') {
      setIsAuthenticated(true);
      showToast('✅ 管理員登入成功！已解鎖管理後台與資料庫系統');
    } else {
      setAuthError('解鎖密碼不正確！請重新輸入');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  // Sync / Pull all responses from Google Sheets
  const handleSyncFromGoogleSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const res = await storageService.syncFromGoogleSheets(sheetsUrl);
      showToast(res.message);
      onRefresh();
    } catch (err: any) {
      showToast(`⚠️ 同步失敗：${err?.message || '請確認網路與試算表設定'}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Import pasted spreadsheet text
  const handleImportPastedText = async () => {
    if (!pastedText.trim()) {
      showToast('⚠️ 請先貼上 Google 試算表或 Excel 的內容');
      return;
    }
    try {
      const parsedRecords = storageService.parsePastedSpreadsheetText(pastedText);
      if (parsedRecords.length === 0) {
        showToast('⚠️ 未能解析出有效問卷列，請確認複製範圍是否包含服務單位或各題分數');
        return;
      }
      const count = await storageService.importBatchRecords(parsedRecords);
      onRefresh();
      setShowPasteModal(false);
      setPastedText('');
      showToast(`✅ 成功匯入 ${count} 筆問卷資料至中央資料庫與統計儀表板！`);
    } catch (err: any) {
      showToast(`⚠️ 匯入失敗：${err?.message || '格式異常'}`);
    }
  };

  // Generate 5 mock seed responses
  const handleGenerateSeed = async () => {
    setActionLoading(true);
    try {
      const addedCount = await storageService.seedMockResponses();
      onRefresh();
      showToast(`✅ 已成功新增 ${addedCount} 筆示範問卷資料！`);
    } catch (err) {
      console.error('Seed error:', err);
      showToast('⚠️ 產生示範資料失敗');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete single response
  const handleDeleteSingle = async () => {
    if (!deleteTargetId) return;
    setActionLoading(true);
    try {
      await storageService.deleteResponse(deleteTargetId);
      setDeleteTargetId(null);
      if (selectedResponse?.id === deleteTargetId) {
        setSelectedResponse(null);
      }
      onRefresh();
      showToast('🗑️ 已成功自資料庫刪除該筆問卷紀錄');
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
      await storageService.clearAllResponses();
      setShowClearAllModal(false);
      onRefresh();
      showToast('🗑️ 已成功清空資料庫所有問卷紀錄');
    } catch (err) {
      console.error('Clear all error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    try {
      const csv = storageService.generateCsvContent(responses);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `苗栗縣三義鄉公所115年度EAP研習問卷彙整_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📥 已成功匯出包含 UTF-8 BOM 之 Excel / CSV 檔案');
    } catch (e) {
      console.error('Export CSV error:', e);
      showToast('⚠️ 匯出失敗，請重試');
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    try {
      const json = JSON.stringify(responses, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `sanyi_eap_survey_backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📦 已下載完整 JSON 資料庫備份檔');
    } catch (e) {
      console.error('Export JSON error:', e);
    }
  };

  // Import JSON Backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const count = storageService.importFromJson(text);
        onRefresh();
        showToast(`✅ 成功匯入並合併 ${count} 筆問卷資料！`);
      } catch (err) {
        showToast('⚠️ JSON 檔案格式錯誤，匯入失敗');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Save Google Sheets Webhook URL
  const handleSaveSheetsUrl = () => {
    const trimmed = sheetsUrl.trim();
    const updated: CloudConfig = {
      ...cloudConfig,
      googleSheetsWebhookUrl: trimmed,
      mode: trimmed ? 'google_sheets' : 'auto'
    };
    saveStoredCloudConfig(updated);
    setCloudConfig(updated);
    showToast('💾 已儲存 Google 試算表雲端同步設定！');
    onRefresh();
  };

  // Test Webhook Connection
  const handleTestConnection = async () => {
    if (!sheetsUrl || !sheetsUrl.startsWith('http')) {
      showToast('⚠️ 請先輸入 Google Apps Script 網址再進行測試');
      return;
    }

    const trimmed = sheetsUrl.trim();
    const updated: CloudConfig = {
      ...cloudConfig,
      googleSheetsWebhookUrl: trimmed,
      mode: 'google_sheets'
    };
    saveStoredCloudConfig(updated);
    setCloudConfig(updated);

    setTestStatus({ loading: true, result: null, isSuccess: false });
    try {
      const res = await storageService.testGoogleSheetsConnection(trimmed);
      setTestStatus({
        loading: false,
        result: res.message,
        isSuccess: res.success
      });
      if (res.success) {
        showToast('✅ 測試資料已成功送出並自動儲存設定！請檢視 Google 試算表');
        onRefresh();
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        result: `連線異常：${err?.message || '請確認 Apps Script 部署設定'}`,
        isSuccess: false
      });
    }
  };

  // Highly Optimized & Error-Tolerant Google Apps Script Code matching the user's sheet name
  const appsScriptTemplate = `// =========================================================================
// 苗栗縣三義鄉公所 115年度 EAP研習問卷 Google 試算表雙向自動讀寫程式 (最新高相容版)
// 目標試算表檔案名稱：115年三義鄉公所EAP研習問卷彙整
// =========================================================================

function doPost(e) {
  return handleSurveyData(e);
}

function doGet(e) {
  if (e && e.parameter && (e.parameter.action === "read" || e.parameter.getResponses === "1" || (!e.parameter.dept && !e.parameter.q3))) {
    return readAllSurveyData();
  }
  return handleSurveyData(e);
}

// 讀取試算表中所有的填答資料回傳給系統後台
function readAllSurveyData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("115年三義鄉公所EAP研習問卷彙整") ||
              ss.getSheetByName("工作表1") ||
              ss.getSheetByName("問卷彙整") ||
              ss.getSheetByName("Sheet1") ||
              ss.getActiveSheet() ||
              ss.getSheets()[0];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 200, count: 0, data: [] })).setMimeType(ContentService.MimeType.JSON);
  }

  var range = sheet.getRange(2, 1, lastRow - 1, 18);
  var values = range.getValues();
  var records = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[2]) continue;
    records.push({
      id: String(row[0] || ('sheet_' + i)),
      time: String(row[1] || ''),
      dept: String(row[2] || '未指定課室'),
      role: String(row[3] || '非主管職員/公務員'),
      gender: String(row[4] || '未提供'),
      scores: {
        q3: Number(row[5]) || 5,
        q4: Number(row[6]) || 5,
        q5: Number(row[7]) || 5,
        q6: Number(row[8]) || 5,
        q7: Number(row[9]) || 5,
        q8: Number(row[10]) || 5,
        q9: Number(row[11]) || 5
      },
      avgPart2: Number(row[12]) || 5,
      avgPart3: Number(row[13]) || 5,
      avgOverall: Number(row[14]) || 5,
      q10: String(row[15] || '（無特別填寫）'),
      q11: String(row[16] || '（無特別填寫）'),
      q12: String(row[17] || '（無特別填寫）')
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 200, count: records.length, data: records })).setMimeType(ContentService.MimeType.JSON);
}

function handleSurveyData(e) {
  var lock = LockService.getScriptLock();
  try {
    // 取得鎖定防止多位同仁同時送出造成資料覆蓋 (最多等待 15 秒)
    lock.waitLock(15000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 智慧定位工作表：優先尋找問卷彙整專用表，若無則抓取預設工作表1或第一張表
    var sheet = ss.getSheetByName("115年三義鄉公所EAP研習問卷彙整") ||
                ss.getSheetByName("工作表1") ||
                ss.getSheetByName("問卷彙整") ||
                ss.getSheetByName("Sheet1") ||
                ss.getActiveSheet() ||
                ss.getSheets()[0];
    
    // 解析傳入的問卷資料 (支援 JSON 字串、Form POST、URL 參數等多種傳輸通道)
    var data = {};
    if (e) {
      if (e.postData && e.postData.contents) {
        try {
          data = JSON.parse(e.postData.contents);
        } catch (jsonErr) {
          try {
            data = JSON.parse(decodeURIComponent(e.postData.contents));
          } catch (e2) {}
        }
      }
      
      if (!data.dept && e.parameter) {
        if (e.parameter.postData) {
          try {
            data = JSON.parse(e.parameter.postData);
          } catch (pErr) {}
        }
        if (!data.dept) {
          data = e.parameter;
        }
      }
    }
    
    // 若工作表全新無資料，自動建立綠色公務標準表頭
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '流水號', '填答時間', '服務單位', '身分別', '性別',
        'Q3主題符合需求', 'Q4技巧具實用性', 'Q5提升情緒自控', 'Q6簡報清晰明確',
        'Q7講師專業透徹', 'Q8授課生動活潑', 'Q9互動答疑良好',
        '第二部分課程均分', '第三部分講師均分', '全卷總平均滿意度',
        'Q10最大收穫或心得', 'Q11改進建議', 'Q12未來期待主題'
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 18);
      headerRange.setBackground('#064e3b'); // 三義公所墨綠色
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }
    
    // 解析分數
    var scores = data.scores || {};
    if (typeof scores === 'string') {
      try { scores = JSON.parse(scores); } catch (e) { scores = {}; }
    }
    
    var q3 = Number(scores.q3 !== undefined ? scores.q3 : (data.q3 || 5));
    var q4 = Number(scores.q4 !== undefined ? scores.q4 : (data.q4 || 5));
    var q5 = Number(scores.q5 !== undefined ? scores.q5 : (data.q5 || 5));
    var q6 = Number(scores.q6 !== undefined ? scores.q6 : (data.q6 || 5));
    var q7 = Number(scores.q7 !== undefined ? scores.q7 : (data.q7 || 5));
    var q8 = Number(scores.q8 !== undefined ? scores.q8 : (data.q8 || 5));
    var q9 = Number(scores.q9 !== undefined ? scores.q9 : (data.q9 || 5));
    
    var avgPart2 = data.avgPart2 ? Number(data.avgPart2) : parseFloat(((q3 + q4 + q5 + q6) / 4).toFixed(2));
    var avgPart3 = data.avgPart3 ? Number(data.avgPart3) : parseFloat(((q7 + q8 + q9) / 3).toFixed(2));
    var avgOverall = data.avgOverall ? Number(data.avgOverall) : parseFloat(((q3 + q4 + q5 + q6 + q7 + q8 + q9) / 7).toFixed(2));
    
    var timeStr = data.time || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss");
    var recordId = data.id || ('resp_' + new Date().getTime());
    
    // 防重複寫入保護：檢查最近 30 列是否已存在相同的問卷流水號 ID
    var lastRow = sheet.getLastRow();
    if (lastRow > 1 && data.id) {
      var startRow = Math.max(2, lastRow - 30);
      var checkCount = lastRow - startRow + 1;
      var existingIdCol = sheet.getRange(startRow, 1, checkCount, 1).getValues();
      for (var r = 0; r < existingIdCol.length; r++) {
        if (existingIdCol[r][0] === data.id) {
          return ContentService
            .createTextOutput(JSON.stringify({ result: "duplicate_skipped", status: 200, message: "已存在相同流水號，已自動略過重複寫入！" }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // 寫入問卷新紀錄列 (保證單一寫入)
    sheet.appendRow([
      recordId,
      timeStr,
      data.dept || '未指定課室',
      data.role || '非主管職員/公務員',
      data.gender || '未提供',
      q3, q4, q5, q6, q7, q8, q9,
      avgPart2,
      avgPart3,
      avgOverall,
      data.q10 || '（無特別填寫）',
      data.q11 || '（無特別填寫）',
      data.q12 || '（無特別填寫）'
    ]);
    
    SpreadsheetApp.flush();
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", status: 200, message: "資料已成功寫入試算表！" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptTemplate);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
    showToast('📋 已複製 Google Apps Script 完整程式碼！');
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

  const activeEngine = storageService.getEngineLabel();
  const shareableUrl = getShareableSurveyUrl();

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
            請輸入管理密碼以檢視苗栗縣三義鄉公所資料庫明細、維護紀錄與設定雲端同步
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
                placeholder="請輸入解鎖密碼"
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
              <span>驗證並開啟管理後台</span>
            </button>
          </form>
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
            🏛️
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-emerald-200">
                登入管理員：
                <span className="font-mono font-bold text-white ml-1">{adminEmail || '人事室管理員'}</span>
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {activeEngine.label}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black mt-0.5">
              苗栗縣三義鄉公所 115年度 EAP 問卷後台管理系統
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
            <span>匯出 Excel / CSV</span>
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

      {/* Sub Tab Switcher */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          onClick={() => setAdminSubTab('records')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition ${
            adminSubTab === 'records'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>問卷填答紀錄明細 ({responses.length})</span>
        </button>

        <button
          onClick={() => setAdminSubTab('cloud_setup')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition ${
            adminSubTab === 'cloud_setup'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Cloud className="w-4 h-4 text-emerald-700" />
          <span>⚙️ Google 試算表自動寫入設定與測試</span>
          {cloudConfig.googleSheetsWebhookUrl && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>
      </div>

      {/* SUB-VIEW 1: Records Table */}
      {adminSubTab === 'records' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200 space-y-4">
          {/* Table Top Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <h4 className="text-base font-black text-stone-900">
                📋 全所同仁問卷填答明細列表
              </h4>
              <p className="text-xs text-stone-500">
                目前資料庫累積共 <b className="text-emerald-800 font-mono">{responses.length}</b> 筆資料
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs"
                title="系統背景已啟用全自動即時同步：同仁只要在 Google 試算表填報，系統每 5 秒即自動偵測並同步至中央資料庫與統計儀表板，無須人工操作"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>🟢 試算表自動同步中</span>
                <button
                  onClick={handleSyncFromGoogleSheets}
                  disabled={isSyncingSheets || actionLoading}
                  className="ml-1 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-0.5 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-1"
                  title="點擊進行立即強制檢查"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheets ? '同步中...' : '⚡ 立即檢查'}</span>
                </button>
              </div>

              <button
                onClick={() => setShowPasteModal(true)}
                className="flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-300 font-bold transition"
                title="直接複製 Google 試算表或 Excel 中的問卷表格貼上匯入"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>📋 貼上試算表匯入</span>
              </button>

              <button
                onClick={handleGenerateSeed}
                disabled={actionLoading}
                className="flex items-center gap-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-xl border border-stone-300 font-bold transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
                <span>➕ 示範 5 筆</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-300 font-bold transition"
                title="下載完整的 JSON 備份檔"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>備份 JSON</span>
              </button>

              <label className="flex items-center gap-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-300 font-bold transition cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-stone-600" />
                <span>匯入 JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowClearAllModal(true)}
                disabled={actionLoading || responses.length === 0}
                className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-bold shadow transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空資料庫</span>
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
                            title="從資料庫刪除此筆"
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
      )}

      {/* SUB-VIEW 2: Cloud Setup & Google Sheets Test */}
      {adminSubTab === 'cloud_setup' && (
        <div className="space-y-6">
          {/* Key Checklist Card */}
          <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-500 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shrink-0 shadow">
                📊
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-emerald-950">
                    Google 試算表：「115年三義鄉公所EAP研習問卷彙整」自動寫入排查重點
                  </h4>
                  <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    必檢項目
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  若您測試同仁手機填寫後試算表未增加紀錄，請依序檢查以下 <b>3 個關鍵設定</b>，設定正確即可 100% 自動寫入：
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1.5 text-xs text-stone-700">
                <div className="font-black text-emerald-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">1</span>
                  <span>存取權限設為「任何人」</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-normal">
                  在 Apps Script 部署時，<b>「誰可以存取 (Who has access)」</b>必須選為 <b>「任何人 (Anyone)」</b>，否則同仁手機匿名送出會被 Google 阻擋。
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1.5 text-xs text-stone-700">
                <div className="font-black text-emerald-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">2</span>
                  <span>執行身分設為「我」</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-normal">
                  <b>「執行身分 (Execute as)」</b>必須選為 <b>「我 (我的帳戶)」</b>，使腳本有權代表您將問卷資料寫入該 Google 試算表。
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1.5 text-xs text-stone-700">
                <div className="font-black text-emerald-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">3</span>
                  <span>透過 QR Code 分享網址</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-normal">
                  設定儲存後，至上方<b>「現場投影與分享」</b>出示 QR Code，系統已自動將試算表同步參數加密帶入 QR Code 中，全所同仁手機掃碼即自動同步！
                </p>
              </div>
            </div>
          </div>

          {/* Webhook Configuration & Testing Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  🔗
                </span>
                <div>
                  <h4 className="text-base font-black text-stone-900">
                    Google Apps Script 網頁應用程式網址 (Webhook URL)
                  </h4>
                  <p className="text-xs text-stone-500">
                    目標試算表：<code className="text-emerald-800 font-bold">115年三義鄉公所EAP研習問卷彙整</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-stone-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSaveSheetsUrl}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow transition whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>儲存網址設定</span>
                </button>
              </div>

              {/* Instant Test Connection Button */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus.loading || !sheetsUrl}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin' : ''}`} />
                  <span>{testStatus.loading ? '正在發送測試資料...' : '🧪 立即測試傳送一筆測試資料至 Google 試算表'}</span>
                </button>

                <span className="text-[11px] text-stone-500">
                  （點擊後系統會立即送出 1 筆測試問卷，請直接至 Google 試算表查看是否多出一列）
                </span>
              </div>

              {/* Test Result Feedback Alert */}
              {testStatus.result && (
                <div
                  className={`p-4 rounded-xl text-xs font-bold border flex items-start gap-2 ${
                    testStatus.isSuccess
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <span className="text-base">{testStatus.isSuccess ? '🎉' : '⚠️'}</span>
                  <div className="space-y-1">
                    <p>{testStatus.result}</p>
                    {testStatus.isSuccess && (
                      <p className="text-[11px] font-normal text-emerald-700">
                        提示：若試算表有順利出現「人事室 (連線測試)」這筆紀錄，代表設定 100% 成功！同仁手機掃碼填寫即可正常寫入。
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Copyable Apps Script Code Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="text-base font-black text-stone-900 flex items-center gap-2">
                <span>📝 專屬 Google Apps Script 程式碼（已預先設定三義鄉公所試算表格式）</span>
              </h4>
              <button
                onClick={handleCopyScript}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow transition"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? '已複製！' : '一鍵複製程式碼'}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <p>
                若您尚未在 Google 試算表中設定程式碼，請依下列步驟貼入：
              </p>
              <ol className="list-decimal list-inside space-y-1 text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <li>開啟您的 Google 試算表 <b>「115年三義鄉公所EAP研習問卷彙整」</b>。</li>
                <li>點選上方選單 <b>「擴充功能」 ➔ 「Apps Script」</b>。</li>
                <li>將編輯器內的預設程式碼完全刪除，貼上下方完整程式碼。</li>
                <li>點選右上角 <b>「部署」 ➔ 「新增部署作業」</b>（或「管理部署作業」選新版本）。</li>
                <li>類型選擇 <b>「網頁應用程式」</b>，將「誰可以存取」設為 <b>「任何人」</b> ➔ 點選「部署」並複製網址。</li>
              </ol>
            </div>

            <div className="relative">
              <pre className="bg-stone-900 text-emerald-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-56">
                {appsScriptTemplate}
              </pre>
            </div>
          </div>
        </div>
      )}

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
              此操作將自資料庫永久移除該筆紀錄，各項統計均分將即時重新計算。
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
            <h3 className="font-bold text-stone-900 text-base">確定清空資料庫？</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              此操作將刪除現有的全部 <b>{responses.length}</b> 筆問卷資料，無法復原！
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

      {/* Paste Spreadsheet / Excel Import Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base sm:text-lg">
                    📋 貼上 Google 試算表 / Excel 資料匯入
                  </h3>
                  <p className="text-xs text-stone-500">
                    直接複製 Google 試算表中的問卷表格列，貼上即可自動解析並寫入資料庫
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              <label className="block text-xs font-bold text-stone-700">
                請在 Google 試算表中選取整列資料複製（Ctrl+C），並在下方欄位貼上（Ctrl+V）：
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="例如：&#10;resp_1725250000	115-09-02 14:15:30	民政課	非主管職員/公務員	女	5	5	5	5	5	5	5	5.00	5.00	5.00	收穫良多	無	正念減壓..."
                rows={9}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-xs font-mono text-stone-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none leading-relaxed"
              />
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  智慧欄位辨識說明：
                </p>
                <p className="text-[11px] text-emerald-800">
                  系統支援直接自試算表全選複製貼上，能自動識別課室名稱、各題分數（1~5分）、心得與建議，自動去重並更新統計分析儀表板！
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
              >
                取消
              </button>
              <button
                onClick={handleImportPastedText}
                disabled={!pastedText.trim()}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow disabled:opacity-50 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>立即解析並匯入中央資料庫</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
