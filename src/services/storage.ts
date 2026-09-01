import { SurveyResponse, AggregateStats } from '../types';
import { getStoredCloudConfig } from './cloudConfig';

const LOCAL_STORAGE_KEY = 'sanyi_eap_survey_responses_115';

// Generate realistic mock data for initial seminar database if local
function getInitialLocalMockData(): SurveyResponse[] {
  const depts = ['民政課', '財行課', '建設課', '觀農課', '社福課', '主計室', '人事室', '清潔隊', '圖書館'];
  const comments10 = [
    '張講師分享的「停、看、聽」情緒急救三部曲非常實用，面對高壓陳情民眾時很有幫助！',
    '學習到公務壓力自我調適與呼吸調節法，對平日辦理繁重業務舒壓很有效果。',
    '講師表達生動幽默，把心理學概念講得非常接地氣，收穫良多！',
    '了解職場過勞前兆與同仁互相關懷的警訊辨識，非常棒的研習。',
    '課程案例貼近鄉鎮公所公務日常，很有共鳴與啟發。'
  ];
  const comments11 = [
    '會議室空調適中，簡報字體清晰，安排非常流暢。',
    '建議未來可增加分組演練或實際情境模擬時間。',
    '人事室籌劃用心，感謝提供研習講義與茶水。',
    '無特別意見，一切非常圓滿。'
  ];
  const comments12 = [
    '期待辦理公務員退休心理準備與理財規劃講座。',
    '希望有「溝通與衝突化解實戰技巧」相關主題。',
    '職場正念減壓(MBSR)與睡眠品質改善專題。',
    '親子溝通與家庭支持系列。'
  ];

  const list: SurveyResponse[] = [];
  const baseTime = 1756800000000; // Fixed baseline timestamp for cross-device consistency

  for (let i = 0; i < 8; i++) {
    const dept = depts[i % depts.length];
    const q3 = (i % 2 === 0) ? 5 : 4;
    const q4 = 5;
    const q5 = (i % 3 === 0) ? 4 : 5;
    const q6 = 5;
    const q7 = 5;
    const q8 = (i % 2 === 0) ? 5 : 4;
    const q9 = 5;

    const avgP2 = parseFloat(((q3 + q4 + q5 + q6) / 4).toFixed(2));
    const avgP3 = parseFloat(((q7 + q8 + q9) / 3).toFixed(2));
    const avgOverall = parseFloat(((q3 + q4 + q5 + q6 + q7 + q8 + q9) / 7).toFixed(2));

    const dateObj = new Date(baseTime + i * 420000);
    const timeStr = `115-09-02 ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;

    list.push({
      id: `resp_demo_1150902_${i + 1}`,
      timestamp: baseTime + i * 420000,
      time: timeStr,
      dept: dept,
      role: '非主管職員/公務員',
      gender: i % 2 === 0 ? '女' : '男',
      scores: { q3, q4, q5, q6, q7, q8, q9 },
      avgPart2: avgP2,
      avgPart3: avgP3,
      avgOverall: avgOverall,
      q10: comments10[i % comments10.length],
      q11: comments11[i % comments11.length],
      q12: comments12[i % comments12.length]
    });
  }

  return list.sort((a, b) => b.timestamp - a.timestamp);
}

// Local Storage Helper
function getLocalResponses(): SurveyResponse[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    const initial = getInitialLocalMockData();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch (e) {
    console.error('Error reading local storage responses:', e);
    return getInitialLocalMockData();
  }
}

function saveLocalResponses(list: SurveyResponse[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving local storage responses:', e);
  }
}

// Compute client-side AggregateStats
export function computeStatsFromResponses(records: SurveyResponse[]): AggregateStats {
  const total = records.length;
  if (total === 0) {
    return {
      totalCount: 0,
      avgOverall: 0,
      avgPart2: 0,
      avgPart3: 0,
      satisfactionRate: 0,
      questionAverages: [],
      departmentBreakdown: [],
      scoreDistribution: []
    };
  }

  let sumOverall = 0;
  let sumP2 = 0;
  let sumP3 = 0;
  let satisfiedCount = 0;

  const qSums: Record<string, number> = { q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0 };
  const qDist: Record<string, Record<number, number>> = {
    q3: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    q4: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    q5: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    q6: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    q7: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    q8: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    q9: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };

  const deptMap: Record<string, { count: number; sumOverall: number }> = {};
  const scoreDistMap: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  records.forEach(r => {
    sumOverall += r.avgOverall || 0;
    sumP2 += r.avgPart2 || 0;
    sumP3 += r.avgPart3 || 0;

    if (r.avgOverall >= 4.0) {
      satisfiedCount++;
    }

    const roundedScore = Math.min(5, Math.max(1, Math.round(r.avgOverall)));
    scoreDistMap[roundedScore] = (scoreDistMap[roundedScore] || 0) + 1;

    if (r.scores) {
      Object.keys(qSums).forEach(qKey => {
        const val = r.scores[qKey as keyof typeof r.scores] || 5;
        qSums[qKey] += val;
        if (qDist[qKey] && qDist[qKey][val] !== undefined) {
          qDist[qKey][val]++;
        }
      });
    }

    const d = r.dept || '其他';
    if (!deptMap[d]) {
      deptMap[d] = { count: 0, sumOverall: 0 };
    }
    deptMap[d].count += 1;
    deptMap[d].sumOverall += r.avgOverall || 0;
  });

  const questionLabels: Record<string, { label: string; category: string }> = {
    q3: { label: 'Q3 主題符合需求', category: '課程' },
    q4: { label: 'Q4 技巧具實用性', category: '課程' },
    q5: { label: 'Q5 提升情緒自控', category: '課程' },
    q6: { label: 'Q6 簡報清晰明確', category: '課程' },
    q7: { label: 'Q7 講師專業透徹', category: '講師' },
    q8: { label: 'Q8 授課生動活潑', category: '講師' },
    q9: { label: 'Q9 互動答疑良好', category: '講師' }
  };

  const questionAverages = Object.keys(qSums).map(qKey => ({
    id: qKey,
    label: questionLabels[qKey]?.label || qKey,
    category: questionLabels[qKey]?.category || '課程',
    avg: parseFloat((qSums[qKey] / total).toFixed(2)),
    distribution: qDist[qKey]
  }));

  const departmentBreakdown = Object.keys(deptMap).map(d => ({
    dept: d,
    count: deptMap[d].count,
    percentage: parseFloat(((deptMap[d].count / total) * 100).toFixed(1)),
    avgOverall: parseFloat((deptMap[d].sumOverall / deptMap[d].count).toFixed(2))
  })).sort((a, b) => b.count - a.count);

  const scoreDistribution = [
    { score: 5, label: '非常滿意 (5分)', count: scoreDistMap[5], percentage: parseFloat(((scoreDistMap[5] / total) * 100).toFixed(1)) },
    { score: 4, label: '滿意 (4分)', count: scoreDistMap[4], percentage: parseFloat(((scoreDistMap[4] / total) * 100).toFixed(1)) },
    { score: 3, label: '普通 (3分)', count: scoreDistMap[3], percentage: parseFloat(((scoreDistMap[3] / total) * 100).toFixed(1)) },
    { score: 2, label: '不太滿意 (2分)', count: scoreDistMap[2], percentage: parseFloat(((scoreDistMap[2] / total) * 100).toFixed(1)) },
    { score: 1, label: '非常不滿意 (1分)', count: scoreDistMap[1], percentage: parseFloat(((scoreDistMap[1] / total) * 100).toFixed(1)) }
  ];

  return {
    totalCount: total,
    avgOverall: parseFloat((sumOverall / total).toFixed(2)),
    avgPart2: parseFloat((sumP2 / total).toFixed(2)),
    avgPart3: parseFloat((sumP3 / total).toFixed(2)),
    satisfactionRate: parseFloat(((satisfiedCount / total) * 100).toFixed(1)),
    questionAverages,
    departmentBreakdown,
    scoreDistribution
  };
}

class StorageService {
  private apiAvailable: boolean | null = null;

  // Check if Express/Serverless backend API is answering with JSON
  private async checkApi(): Promise<boolean> {
    const config = getStoredCloudConfig();
    if (config.mode === 'local') {
      this.apiAvailable = false;
      return false;
    }

    try {
      const res = await fetch('/api/health', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.status === 'ok') {
          this.apiAvailable = true;
          return true;
        }
      }
    } catch {
      // Backend not available (e.g. Vercel static SPA without server)
    }
    this.apiAvailable = false;
    return false;
  }

  // Get active storage engine label
  public getEngineLabel(): { label: string; mode: string; isCloud: boolean } {
    const config = getStoredCloudConfig();
    if (config.googleSheetsWebhookUrl && config.googleSheetsWebhookUrl.trim().length > 0) {
      return { label: 'Google 試算表雲端同步模式', mode: 'google_sheets', isCloud: true };
    }
    if (this.apiAvailable === true) {
      return { label: '伺服器後端中央資料庫 (API)', mode: 'api', isCloud: true };
    }
    return { label: '瀏覽器安全持久化資料庫', mode: 'local', isCloud: false };
  }

  // In-memory set to prevent duplicate client-side transmissions
  private clientSyncedRecordIds = new Set<string>();

  // Send single record to Google Sheets Apps Script Webhook (Single clean transmission)
  public async syncRecordToGoogleSheets(webhookUrl: string, record: SurveyResponse): Promise<boolean> {
    if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

    const trimmedUrl = webhookUrl.trim();
    if (this.clientSyncedRecordIds.has(record.id)) {
      console.log(`[Storage] Record ${record.id} already synced to Google Sheets, skipping duplicate.`);
      return true;
    }
    this.clientSyncedRecordIds.add(record.id);

    const flatRecord = {
      id: record.id,
      timestamp: record.timestamp,
      time: record.time,
      dept: record.dept,
      role: record.role || '非主管職員/公務員',
      gender: record.gender || '未提供',
      q3: record.scores?.q3 ?? 5,
      q4: record.scores?.q4 ?? 5,
      q5: record.scores?.q5 ?? 5,
      q6: record.scores?.q6 ?? 5,
      q7: record.scores?.q7 ?? 5,
      q8: record.scores?.q8 ?? 5,
      q9: record.scores?.q9 ?? 5,
      scores: record.scores || { q3: 5, q4: 5, q5: 5, q6: 5, q7: 5, q8: 5, q9: 5 },
      avgPart2: record.avgPart2 ?? 5,
      avgPart3: record.avgPart3 ?? 5,
      avgOverall: record.avgOverall ?? 5,
      q10: record.q10 || '（無特別填寫）',
      q11: record.q11 || '（無特別填寫）',
      q12: record.q12 || '（無特別填寫）'
    };

    const payloadString = JSON.stringify(flatRecord);

    try {
      // Direct clean POST with no-cors to prevent browser preflight block
      await fetch(trimmedUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: payloadString
      });
      console.log('Successfully dispatched single sync to Google Sheets for:', record.id);
      return true;
    } catch (err) {
      console.warn('Direct fetch to Google Sheets failed, trying sendBeacon fallback:', err);
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([payloadString], { type: 'text/plain;charset=utf-8' });
          return navigator.sendBeacon(trimmedUrl, blob);
        }
      } catch (beaconErr) {
        console.error('sendBeacon fallback also failed:', beaconErr);
      }
      return false;
    }
  }

  // Test Google Sheets Connection with Server + Client dual validation
  public async testGoogleSheetsConnection(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return { success: false, message: '請輸入有效的 Google Apps Script 網頁應用程式網址 (https://script.google.com/...)' };
    }

    const testRecord: SurveyResponse = {
      id: `test_${Date.now()}`,
      timestamp: Date.now(),
      time: `115-09-02 ${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`,
      dept: '人事室 (連線測試)',
      role: '主辦人員',
      gender: '不提供',
      scores: { q3: 5, q4: 5, q5: 5, q6: 5, q7: 5, q8: 5, q9: 5 },
      avgPart2: 5.0,
      avgPart3: 5.0,
      avgOverall: 5.0,
      q10: '🔔 此為三義鄉公所 EAP 問卷系統之 Google 試算表連線測試資料！',
      q11: '若您在試算表看到此行，代表所有同仁手機填寫問卷將能 100% 自動寫入！',
      q12: '測試成功'
    };

    // 1. Try server-side test API first for verified HTTP feedback
    try {
      const res = await fetch('/api/test-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // Also fire client test for double validation
          this.syncRecordToGoogleSheets(webhookUrl, testRecord);
          return {
            success: true,
            message: json.message || '✅ 伺服器與瀏覽器已成功發送測試封包至 Google 試算表！請開啟試算表確認是否有新增一筆測試紀錄。'
          };
        }
      }
    } catch (serverErr) {
      console.warn('Server test failed, trying direct browser test:', serverErr);
    }

    // 2. Direct browser test
    try {
      await this.syncRecordToGoogleSheets(webhookUrl, testRecord);
      return {
        success: true,
        message: '✅ 測試封包已成功送出！請開啟「115年三義鄉公所EAP研習問卷彙整」試算表確認是否有新增一筆「人事室 (連線測試)」紀錄。'
      };
    } catch (e: any) {
      return {
        success: false,
        message: `⚠️ 送出測試失敗：${e?.message || '請確認 Apps Script 部署設定是否設為「任何人」'}`
      };
    }
  }

  // 1. Fetch all responses
  public async getAllResponses(): Promise<{ data: SurveyResponse[]; isApi: boolean }> {
    const isApi = await this.checkApi();

    if (isApi) {
      try {
        const res = await fetch('/api/responses');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            saveLocalResponses(json.data);
            return { data: json.data, isApi: true };
          }
        }
      } catch (err) {
        console.warn('API fetch failed, falling back to local storage:', err);
      }
    }

    // Fallback to local storage
    const localData = getLocalResponses();
    return { data: localData, isApi: false };
  }

  // 2. Fetch stats
  public async getStats(): Promise<AggregateStats> {
    const isApi = await this.checkApi();
    if (isApi) {
      try {
        const res = await fetch('/api/stats');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json && typeof json.totalCount === 'number') {
            return json;
          }
        }
      } catch (err) {
        console.warn('API stats fetch failed, computing locally:', err);
      }
    }

    const localData = getLocalResponses();
    return computeStatsFromResponses(localData);
  }

  // 3. Submit a new response
  public async submitResponse(payload: {
    dept: string;
    role?: string;
    gender?: string;
    scores: { q3: number; q4: number; q5: number; q6: number; q7: number; q8: number; q9: number };
    q10?: string;
    q11?: string;
    q12?: string;
  }): Promise<{ success: boolean; data: SurveyResponse; totalCount: number; engine: string }> {
    const { q3, q4, q5, q6, q7, q8, q9 } = payload.scores;
    const s3 = Number(q3) || 5;
    const s4 = Number(q4) || 5;
    const s5 = Number(q5) || 5;
    const s6 = Number(q6) || 5;
    const s7 = Number(q7) || 5;
    const s8 = Number(q8) || 5;
    const s9 = Number(q9) || 5;

    const avgPart2 = parseFloat(((s3 + s4 + s5 + s6) / 4).toFixed(2));
    const avgPart3 = parseFloat(((s7 + s8 + s9) / 3).toFixed(2));
    const avgOverall = parseFloat(((s3 + s4 + s5 + s6 + s7 + s8 + s9) / 7).toFixed(2));

    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const timeStr = `${rocYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newRecord: SurveyResponse = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      time: timeStr,
      dept: payload.dept.trim(),
      role: payload.role ? payload.role.trim() : undefined,
      gender: payload.gender ? payload.gender.trim() : undefined,
      scores: { q3: s3, q4: s4, q5: s5, q6: s6, q7: s7, q8: s8, q9: s9 },
      avgPart2,
      avgPart3,
      avgOverall,
      q10: payload.q10 ? payload.q10.trim() : '（無特別填寫）',
      q11: payload.q11 ? payload.q11.trim() : '（無特別填寫）',
      q12: payload.q12 ? payload.q12.trim() : '（無特別填寫）'
    };

    const config = getStoredCloudConfig();

    // 1. Primary path: Sync via Express API (which handles unified storage & single server-side forward to Google Sheets)
    const isApi = await this.checkApi();
    if (isApi) {
      try {
        const res = await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            id: newRecord.id,
            timestamp: newRecord.timestamp,
            time: newRecord.time,
            googleSheetsWebhookUrl: config.googleSheetsWebhookUrl
          })
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && json.data) {
            const locals = getLocalResponses();
            saveLocalResponses([json.data, ...locals.filter(x => x.id !== json.data.id)]);

            // If server indicated Google Sheets was not synced (or server had no URL), and client has URL, do client direct fallback
            if (!json.googleSheetsSynced && config.googleSheetsWebhookUrl && config.googleSheetsWebhookUrl.trim().length > 0) {
              this.syncRecordToGoogleSheets(config.googleSheetsWebhookUrl.trim(), json.data);
            }

            return {
              success: true,
              data: json.data,
              totalCount: json.totalCount || locals.length + 1,
              engine: config.googleSheetsWebhookUrl ? 'google_sheets' : 'api'
            };
          }
        }
      } catch (err) {
        console.warn('API POST failed, falling back to client-side direct sync:', err);
      }
    }

    // 2. Offline / Static fallback: Direct client sync to Google Sheets (if configured)
    if (config.googleSheetsWebhookUrl && config.googleSheetsWebhookUrl.trim().length > 0) {
      this.syncRecordToGoogleSheets(config.googleSheetsWebhookUrl.trim(), newRecord);
    }

    // 3. Save to local browser storage
    const currentList = getLocalResponses();
    const updatedList = [newRecord, ...currentList];
    saveLocalResponses(updatedList);

    return {
      success: true,
      data: newRecord,
      totalCount: updatedList.length,
      engine: config.googleSheetsWebhookUrl ? 'google_sheets' : 'local'
    };
  }

  // 4. Delete single response
  public async deleteResponse(id: string): Promise<boolean> {
    const isApi = await this.checkApi();
    if (isApi) {
      try {
        await fetch(`/api/responses/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('API Delete failed, updating local storage:', err);
      }
    }

    const locals = getLocalResponses().filter(x => x.id !== id);
    saveLocalResponses(locals);
    return true;
  }

  // 5. Clear all responses
  public async clearAllResponses(): Promise<boolean> {
    const isApi = await this.checkApi();
    if (isApi) {
      try {
        await fetch('/api/responses', { method: 'DELETE' });
      } catch (err) {
        console.warn('API clear failed:', err);
      }
    }
    saveLocalResponses([]);
    return true;
  }

  // 6. Generate 5 mock seed responses
  public async seedMockResponses(): Promise<number> {
    const isApi = await this.checkApi();
    if (isApi) {
      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          return json.addedCount || 5;
        }
      } catch (err) {
        console.warn('API seed failed, generating locally:', err);
      }
    }

    const depts = ['民政課', '財行課', '建設課', '觀農課', '社福課', '主計室', '人事室', '清潔隊', '圖書館', '市場', '幼兒園'];
    const comments10 = [
      '講師分析職場情緒調適技巧很到位，演練很有感。',
      '學習到如何識別同仁身心耗損徵兆，對機關同儕支持很有啟發！',
      '張心理師幽默風趣，兩小時課程毫無冷場，獲益良多。',
      '學到情緒急救呼吸法，回去後會運用在日常公務中。',
      '公所人事室安排此課程非常貼心，照顧同仁身心。'
    ];
    const comments11 = ['時間剛好，安排得宜。', '希望簡報字體可稍微放大。', '無特別建議，整體非常滿意。'];
    const comments12 = ['正念減壓與優質睡眠改善', '公務溝通與同理心實戰技巧', '健康職場飲食與運動保健'];

    const currentRecords = getLocalResponses();
    const added: SurveyResponse[] = [];

    for (let i = 0; i < 5; i++) {
      const dept = depts[Math.floor(Math.random() * depts.length)];
      const q3 = Math.floor(Math.random() * 2) + 4;
      const q4 = Math.floor(Math.random() * 2) + 4;
      const q5 = Math.floor(Math.random() * 2) + 4;
      const q6 = 5;
      const q7 = 5;
      const q8 = Math.floor(Math.random() * 2) + 4;
      const q9 = Math.floor(Math.random() * 2) + 4;

      const avgP2 = parseFloat(((q3 + q4 + q5 + q6) / 4).toFixed(2));
      const avgP3 = parseFloat(((q7 + q8 + q9) / 3).toFixed(2));
      const avgOverall = parseFloat(((q3 + q4 + q5 + q6 + q7 + q8 + q9) / 7).toFixed(2));

      const now = new Date();
      const timeStr = `115-09-02 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      added.push({
        id: `resp_${Date.now()}_seed_${i}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now() - i * 15000,
        time: timeStr,
        dept,
        role: '非主管職員/公務員',
        gender: i % 2 === 0 ? '女' : '男',
        scores: { q3, q4, q5, q6, q7, q8, q9 },
        avgPart2: avgP2,
        avgPart3: avgP3,
        avgOverall,
        q10: comments10[Math.floor(Math.random() * comments10.length)],
        q11: comments11[Math.floor(Math.random() * comments11.length)],
        q12: comments12[Math.floor(Math.random() * comments12.length)]
      });
    }

    const updated = [...added, ...currentRecords].sort((a, b) => b.timestamp - a.timestamp);
    saveLocalResponses(updated);
    return added.length;
  }

  // 7. Import JSON
  public importFromJson(jsonString: string): number {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        const current = getLocalResponses();
        const map = new Map<string, SurveyResponse>();
        parsed.forEach((item: SurveyResponse) => {
          if (item && item.id) map.set(item.id, item);
        });
        current.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });
        const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        saveLocalResponses(merged);
        return parsed.length;
      }
    } catch (e) {
      console.error('Import error:', e);
      throw new Error('JSON 格式錯誤，請確認檔案內容');
    }
    return 0;
  }

  // 8. Generate CSV with UTF-8 BOM
  public generateCsvContent(records: SurveyResponse[]): string {
    let csv = '\uFEFF';
    csv += '編號,填答時間,服務單位,身分別,性別,Q3主題符合需求,Q4技巧具實用性,Q5提升情緒自控,Q6簡報清晰明確,Q7講師專業透徹,Q8授課生動活潑,Q9互動答疑良好,第二部分課程均分,第三部分講師均分,全卷總平均滿意度,Q10最大收穫或心得,Q11改進建議,Q12未來期待主題\n';

    records.forEach((r, idx) => {
      const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      const row = [
        records.length - idx,
        escapeCsv(r.time),
        escapeCsv(r.dept),
        escapeCsv(r.role || '未提供'),
        escapeCsv(r.gender || '未提供'),
        r.scores?.q3 ?? 5,
        r.scores?.q4 ?? 5,
        r.scores?.q5 ?? 5,
        r.scores?.q6 ?? 5,
        r.scores?.q7 ?? 5,
        r.scores?.q8 ?? 5,
        r.scores?.q9 ?? 5,
        r.avgPart2 ?? 0,
        r.avgPart3 ?? 0,
        r.avgOverall ?? 0,
        escapeCsv(r.q10),
        escapeCsv(r.q11),
        escapeCsv(r.q12)
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  // 9. Sync / Pull from Google Sheets (Bi-directional)
  public async syncFromGoogleSheets(customUrl?: string): Promise<{ success: boolean; message: string; totalCount: number; newCount: number; data: SurveyResponse[] }> {
    const config = getStoredCloudConfig();
    const targetUrl = (customUrl || config.googleSheetsWebhookUrl || '').trim();

    if (!targetUrl || !targetUrl.startsWith('http')) {
      const current = getLocalResponses();
      return { success: false, message: '請先至後台設定 Google 試算表 Webhook 網址', totalCount: current.length, newCount: 0, data: current };
    }

    // 1. Try server API sync first
    const isApi = await this.checkApi();
    if (isApi) {
      try {
        const res = await fetch('/api/sync-sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            saveLocalResponses(json.data);
            return {
              success: true,
              message: json.message || `✅ 成功同步！目前共 ${json.data.length} 筆問卷`,
              totalCount: json.data.length,
              newCount: json.newCount || 0,
              data: json.data
            };
          }
        }
      } catch (err) {
        console.warn('Server sync-sheets failed, attempting direct browser sync:', err);
      }
    }

    // 2. Direct browser sync fallback
    try {
      const fetchUrl = targetUrl.includes('?') ? `${targetUrl}&action=read` : `${targetUrl}?action=read`;
      const res = await fetch(fetchUrl);
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        const current = getLocalResponses();
        const map = new Map<string, SurveyResponse>();
        json.data.forEach((item: any, i: number) => {
          if (!item.dept && !item.scores && !item.q3) return;
          const q3 = Number(item.q3 || item.scores?.q3) || 5;
          const q4 = Number(item.q4 || item.scores?.q4) || 5;
          const q5 = Number(item.q5 || item.scores?.q5) || 5;
          const q6 = Number(item.q6 || item.scores?.q6) || 5;
          const q7 = Number(item.q7 || item.scores?.q7) || 5;
          const q8 = Number(item.q8 || item.scores?.q8) || 5;
          const q9 = Number(item.q9 || item.scores?.q9) || 5;
          const avgPart2 = item.avgPart2 ? Number(item.avgPart2) : parseFloat(((q3 + q4 + q5 + q6) / 4).toFixed(2));
          const avgPart3 = item.avgPart3 ? Number(item.avgPart3) : parseFloat(((q7 + q8 + q9) / 3).toFixed(2));
          const avgOverall = item.avgOverall ? Number(item.avgOverall) : parseFloat(((q3 + q4 + q5 + q6 + q7 + q8 + q9) / 7).toFixed(2));

          const record: SurveyResponse = {
            id: item.id || `sheet_${item.time || Date.now()}_${i}`,
            timestamp: item.timestamp || (item.time ? new Date(String(item.time).replace(/-/g, '/')).getTime() : Date.now()),
            time: item.time || '115-09-02 14:00:00',
            dept: item.dept || '未指定課室',
            role: item.role || '非主管職員/公務員',
            gender: item.gender || '未提供',
            scores: { q3, q4, q5, q6, q7, q8, q9 },
            avgPart2,
            avgPart3,
            avgOverall,
            q10: item.q10 || '（無特別填寫）',
            q11: item.q11 || '（無特別填寫）',
            q12: item.q12 || '（無特別填寫）'
          };
          map.set(record.id, record);
        });

        current.forEach(c => {
          if (!map.has(c.id)) map.set(c.id, c);
        });

        const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        saveLocalResponses(merged);

        return {
          success: true,
          message: `✅ 已自 Google 試算表同步資料！目前共 ${merged.length} 筆問卷`,
          totalCount: merged.length,
          newCount: json.data.length,
          data: merged
        };
      }
    } catch (e: any) {
      console.error('Browser sync failed:', e);
    }

    const locals = getLocalResponses();
    return {
      success: false,
      message: '尚未能從 Google 試算表自動讀回資料，建議檢查 Apps Script 程式碼是否已更新為最新版，或使用下方「手動貼上試算表內容匯入」功能。',
      totalCount: locals.length,
      newCount: 0,
      data: locals
    };
  }

  // 10. Parse Pasted Google Sheet / Excel Text into SurveyResponse objects
  public parsePastedSpreadsheetText(rawText: string): SurveyResponse[] {
    if (!rawText || !rawText.trim()) return [];
    const lines = rawText.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const results: SurveyResponse[] = [];
    const deptsList = ['民政課', '財行課', '建設課', '觀農課', '社福課', '主計室', '人事室', '清潔隊', '圖書館', '市場'];

    lines.forEach((line, lineIdx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Skip header lines
      if (trimmedLine.includes('流水號') || trimmedLine.includes('填答時間') || trimmedLine.includes('服務單位') || trimmedLine.includes('主題符合需求')) {
        return;
      }

      // Split by tab (Excel/Sheets copy) or comma
      let cols = trimmedLine.split('\t');
      if (cols.length < 5) {
        cols = trimmedLine.split(',');
      }

      if (cols.length < 3) return;

      // Clean columns
      cols = cols.map(c => c.trim().replace(/^["']|["']$/g, ''));

      // Find dept
      let dept = '未指定課室';
      for (const d of deptsList) {
        if (cols.some(c => c.includes(d))) {
          dept = d;
          break;
        }
      }
      if (dept === '未指定課室' && cols[2]) {
        dept = cols[2];
      }

      // Find scores (numbers between 1 and 5)
      const numericCols: number[] = [];
      cols.forEach(c => {
        const num = parseFloat(c);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          numericCols.push(num);
        }
      });

      const s3 = numericCols[0] || 5;
      const s4 = numericCols[1] || 5;
      const s5 = numericCols[2] || 5;
      const s6 = numericCols[3] || 5;
      const s7 = numericCols[4] || 5;
      const s8 = numericCols[5] || 5;
      const s9 = numericCols[6] || 5;

      const avgP2 = parseFloat(((s3 + s4 + s5 + s6) / 4).toFixed(2));
      const avgP3 = parseFloat(((s7 + s8 + s9) / 3).toFixed(2));
      const avgOverall = parseFloat(((s3 + s4 + s5 + s6 + s7 + s8 + s9) / 7).toFixed(2));

      // Time
      let timeStr = cols[1] || '';
      if (!timeStr || !timeStr.includes('-') && !timeStr.includes('/')) {
        const now = new Date();
        timeStr = `115-09-02 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      }

      // Text comments
      const textCols = cols.filter(c => c.length > 4 && !c.startsWith('resp_') && !c.includes(':'));
      const q10 = textCols[0] || cols[cols.length - 3] || '（無特別填寫）';
      const q11 = textCols[1] || cols[cols.length - 2] || '（無特別填寫）';
      const q12 = textCols[2] || cols[cols.length - 1] || '（無特別填寫）';

      results.push({
        id: cols[0] && cols[0].startsWith('resp_') ? cols[0] : `pasted_${Date.now()}_${lineIdx}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now() - lineIdx * 1000,
        time: timeStr,
        dept,
        role: cols.find(c => c.includes('主管') || c.includes('人員') || c.includes('公務員')) || '非主管職員/公務員',
        gender: cols.find(c => c === '男' || c === '女') || '未提供',
        scores: { q3: s3, q4: s4, q5: s5, q6: s6, q7: s7, q8: s8, q9: s9 },
        avgPart2: avgP2,
        avgPart3: avgP3,
        avgOverall,
        q10: q10.replace(/^"|"$/g, ''),
        q11: q11.replace(/^"|"$/g, ''),
        q12: q12.replace(/^"|"$/g, '')
      });
    });

    return results;
  }

  // 11. Batch save imported records to database
  public async importBatchRecords(records: SurveyResponse[]): Promise<number> {
    if (!records || records.length === 0) return 0;

    const isApi = await this.checkApi();
    if (isApi) {
      try {
        const res = await fetch('/api/import-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            saveLocalResponses(json.data);
            return json.addedCount || records.length;
          }
        }
      } catch (err) {
        console.warn('API batch import failed, saving locally:', err);
      }
    }

    const current = getLocalResponses();
    const map = new Map<string, SurveyResponse>();
    records.forEach(r => map.set(r.id, r));
    current.forEach(c => {
      if (!map.has(c.id)) map.set(c.id, c);
    });

    const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
    saveLocalResponses(merged);
    return records.length;
  }
}

export const storageService = new StorageService();
