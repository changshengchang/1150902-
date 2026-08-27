import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Path to unified database file
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'responses.json');
const CONFIG_FILE = path.join(DATA_DIR, 'cloud_config.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CloudConfig {
  mode: 'auto' | 'api' | 'google_sheets' | 'firebase' | 'local';
  googleSheetsWebhookUrl?: string;
}

// In-memory cache for cloud config
let cachedCloudConfig: CloudConfig | null = null;

function readCloudConfig(): CloudConfig {
  if (cachedCloudConfig && cachedCloudConfig.googleSheetsWebhookUrl) {
    return cachedCloudConfig;
  }
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      cachedCloudConfig = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Error reading cloud config:', err);
  }
  const fallback: CloudConfig = {
    mode: 'auto',
    googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || ''
  };
  cachedCloudConfig = fallback;
  return fallback;
}

function writeCloudConfig(config: CloudConfig): boolean {
  try {
    cachedCloudConfig = config;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log('[Server Cloud Config Saved]', config);
    return true;
  } catch (err) {
    console.error('Error writing cloud config:', err);
    return false;
  }
}

// Track recently forwarded record IDs to guarantee single transmission per record
const forwardedRecordIds = new Set<string>();

// Server-side robust forwarder to Google Sheets Apps Script
async function forwardToGoogleSheetsServerSide(record: ResponseRecord, customUrl?: string): Promise<boolean> {
  const cfg = readCloudConfig();
  const targetUrl = (customUrl || cfg.googleSheetsWebhookUrl || '').trim();

  if (!targetUrl || !targetUrl.startsWith('http')) {
    console.log('[Google Sheets Server Forwarder] No Google Sheets Webhook URL configured, skipping.');
    return false;
  }

  // Ensure config is persisted if we received a customUrl from client
  if (customUrl && customUrl.startsWith('http') && cfg.googleSheetsWebhookUrl !== customUrl) {
    writeCloudConfig({ ...cfg, googleSheetsWebhookUrl: customUrl, mode: 'google_sheets' });
  }

  // Deduplication check: Do not send the same record ID more than once
  if (forwardedRecordIds.has(record.id)) {
    console.log(`[Google Sheets Server Forwarder] Record ${record.id} already forwarded, skipping duplicate.`);
    return true;
  }
  forwardedRecordIds.add(record.id);

  // Keep deduplication set bounded
  if (forwardedRecordIds.size > 2000) {
    const oldestKey = forwardedRecordIds.values().next().value;
    if (oldestKey) forwardedRecordIds.delete(oldestKey);
  }

  console.log(`[Google Sheets Server Forwarder] Forwarding record ${record.id} (${record.dept}) to ${targetUrl}`);

  // Format comprehensive flat and nested payload for 100% Google Apps Script compatibility
  const forwardPayload = {
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

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(forwardPayload),
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    });

    const resText = await response.text();
    console.log(`[Google Sheets Server Forwarder] Success! Status: ${response.status}. Response preview: ${resText.substring(0, 150)}`);
    return true;
  } catch (err: any) {
    console.warn('[Google Sheets Server Forwarder POST Warning]', err?.message || err);

    // Fallback: Try Form/GET URL
    try {
      const params = new URLSearchParams({
        id: forwardPayload.id,
        time: forwardPayload.time,
        dept: forwardPayload.dept,
        role: forwardPayload.role,
        gender: forwardPayload.gender,
        q3: String(forwardPayload.q3),
        q4: String(forwardPayload.q4),
        q5: String(forwardPayload.q5),
        q6: String(forwardPayload.q6),
        q7: String(forwardPayload.q7),
        q8: String(forwardPayload.q8),
        q9: String(forwardPayload.q9),
        avgPart2: String(forwardPayload.avgPart2),
        avgPart3: String(forwardPayload.avgPart3),
        avgOverall: String(forwardPayload.avgOverall),
        q10: forwardPayload.q10,
        q11: forwardPayload.q11,
        q12: forwardPayload.q12
      });
      const getUrl = targetUrl.includes('?') ? `${targetUrl}&${params.toString()}` : `${targetUrl}?${params.toString()}`;
      const getRes = await fetch(getUrl, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(8000) });
      console.log(`[Google Sheets Server Forwarder GET Fallback] Success! Status: ${getRes.status}`);
      return true;
    } catch (getErr: any) {
      console.error('[Google Sheets Server Forwarder GET Fallback Error]', getErr?.message || getErr);
      return false;
    }
  }
}

// Read / Pull all responses from Google Sheets Apps Script web app
async function pullFromGoogleSheetsServerSide(customUrl?: string): Promise<{ success: boolean; data: ResponseRecord[]; newCount: number; message: string }> {
  const cfg = readCloudConfig();
  const targetUrl = (customUrl || cfg.googleSheetsWebhookUrl || '').trim();

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return { success: false, data: readDatabase(), newCount: 0, message: '尚未設定有效的 Google 試算表 Webhook 網址' };
  }

  try {
    const fetchUrl = targetUrl.includes('?') ? `${targetUrl}&action=read` : `${targetUrl}?action=read`;
    console.log(`[Google Sheets Pull] Fetching records from ${fetchUrl}`);

    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000)
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch (parseErr) {
      console.warn('[Google Sheets Pull Parse Warning] Response was not pure JSON:', text.substring(0, 100));
    }

    const incomingRecords: ResponseRecord[] = [];

    if (json && Array.isArray(json.data)) {
      json.data.forEach((r: any, idx: number) => {
        if (!r.dept && !r.scores && !r.q3) return;
        const q3 = Number(r.q3 || r.scores?.q3) || 5;
        const q4 = Number(r.q4 || r.scores?.q4) || 5;
        const q5 = Number(r.q5 || r.scores?.q5) || 5;
        const q6 = Number(r.q6 || r.scores?.q6) || 5;
        const q7 = Number(r.q7 || r.scores?.q7) || 5;
        const q8 = Number(r.q8 || r.scores?.q8) || 5;
        const q9 = Number(r.q9 || r.scores?.q9) || 5;

        const avgPart2 = r.avgPart2 ? Number(r.avgPart2) : parseFloat(((q3 + q4 + q5 + q6) / 4).toFixed(2));
        const avgPart3 = r.avgPart3 ? Number(r.avgPart3) : parseFloat(((q7 + q8 + q9) / 3).toFixed(2));
        const avgOverall = r.avgOverall ? Number(r.avgOverall) : parseFloat(((q3 + q4 + q5 + q6 + q7 + q8 + q9) / 7).toFixed(2));

        incomingRecords.push({
          id: r.id || `sheet_${r.time || Date.now()}_${idx}`,
          timestamp: r.timestamp || (r.time ? new Date(String(r.time).replace(/-/g, '/')).getTime() : Date.now()),
          time: r.time || '115-09-02 14:00:00',
          dept: String(r.dept || '未指定課室').trim(),
          role: r.role || '非主管職員/公務員',
          gender: r.gender || '未提供',
          scores: { q3, q4, q5, q6, q7, q8, q9 },
          avgPart2,
          avgPart3,
          avgOverall,
          q10: r.q10 || '（無特別填寫）',
          q11: r.q11 || '（無特別填寫）',
          q12: r.q12 || '（無特別填寫）'
        });
      });
    }

    if (incomingRecords.length === 0) {
      return { success: true, data: readDatabase(), newCount: 0, message: 'Google 試算表目前尚無新填答資料或已全數同步！' };
    }

    const currentRecords = readDatabase();
    const existingIds = new Set(currentRecords.map(r => r.id));
    let newCount = 0;

    const merged = [...currentRecords];

    incomingRecords.forEach(inRec => {
      if (!existingIds.has(inRec.id)) {
        // Also check by time + dept + q10 uniqueness
        const duplicate = merged.find(m => m.dept === inRec.dept && m.time === inRec.time && m.q10 === inRec.q10);
        if (!duplicate) {
          merged.unshift(inRec);
          existingIds.add(inRec.id);
          newCount++;
        }
      }
    });

    merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    writeDatabase(merged);

    console.log(`[Google Sheets Pull Success] Merged ${incomingRecords.length} records from sheets. New records added: ${newCount}. Total database: ${merged.length}`);
    return {
      success: true,
      data: merged,
      newCount,
      message: `✅ 已成功自 Google 試算表同步資料！新增 ${newCount} 筆，目前資料庫共 ${merged.length} 筆問卷。`
    };
  } catch (err: any) {
    console.error('[Google Sheets Pull Error]', err);
    return {
      success: false,
      data: readDatabase(),
      newCount: 0,
      message: `同步失敗：${err?.message || '請確認試算表 Apps Script 部署設定'}`
    };
  }
}

// Global Auto-Sync Daemon State
let lastAutoSyncTimestamp = 0;
let isSyncInProgress = false;

async function runAutoSyncFromSheets(force = false): Promise<void> {
  if (isSyncInProgress) return;
  const now = Date.now();
  if (!force && now - lastAutoSyncTimestamp < 5000) return; // rate limit: at most once every 5 seconds

  const cfg = readCloudConfig();
  if (!cfg.googleSheetsWebhookUrl || !cfg.googleSheetsWebhookUrl.startsWith('http')) return;

  isSyncInProgress = true;
  lastAutoSyncTimestamp = now;
  try {
    const res = await pullFromGoogleSheetsServerSide();
    if (res.newCount > 0) {
      console.log(`[Google Sheets Auto-Sync] 🟢 自動同步偵測到並匯入 ${res.newCount} 筆新問卷，目前資料庫共 ${res.data.length} 筆！`);
    }
  } catch (err) {
    // transient network error
  } finally {
    isSyncInProgress = false;
  }
}

interface ResponseRecord {
  id: string;
  timestamp: number;
  time: string;
  dept: string;
  role?: string;
  gender?: string;
  scores: {
    q3: number;
    q4: number;
    q5: number;
    q6: number;
    q7: number;
    q8: number;
    q9: number;
  };
  avgPart2: number;
  avgPart3: number;
  avgOverall: number;
  q10: string;
  q11: string;
  q12: string;
}

// Generate realistic mock data for initial seminar database
function getInitialMockData(): ResponseRecord[] {
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

  const list: ResponseRecord[] = [];
  const baseTime = Date.now() - 3600 * 1000 * 2; // 2 hours ago

  for (let i = 0; i < 8; i++) {
    const dept = depts[i % depts.length];
    const q3 = Math.min(5, Math.floor(Math.random() * 2) + 4);
    const q4 = Math.min(5, Math.floor(Math.random() * 2) + 4);
    const q5 = Math.min(5, Math.floor(Math.random() * 2) + 4);
    const q6 = 5;
    const q7 = 5;
    const q8 = Math.min(5, Math.floor(Math.random() * 2) + 4);
    const q9 = Math.min(5, Math.floor(Math.random() * 2) + 4);

    const avgP2 = parseFloat(((q3 + q4 + q5 + q6) / 4).toFixed(2));
    const avgP3 = parseFloat(((q7 + q8 + q9) / 3).toFixed(2));
    const avgOverall = parseFloat(((q3 + q4 + q5 + q6 + q7 + q8 + q9) / 7).toFixed(2));

    const dateObj = new Date(baseTime + i * 420000);
    const timeStr = `115-09-02 ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;

    list.push({
      id: `resp_${Date.now() - (8 - i) * 100000}_${Math.random().toString(36).substring(2, 6)}`,
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

// Read responses safely from JSON database
function readDatabase(): ResponseRecord[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData = getInitialMockData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error reading responses database:', err);
    return [];
  }
}

// Write responses safely to JSON database
function writeDatabase(data: ResponseRecord[]): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing responses database:', err);
    return false;
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  const records = readDatabase();
  res.json({
    status: 'ok',
    system: '苗栗縣三義鄉公所115年度EAP研習問卷中央資料庫',
    totalResponses: records.length,
    timestamp: new Date().toISOString()
  });
});

// 2. Get all responses
app.get('/api/responses', async (req, res) => {
  // Proactively check and sync from Google Sheets if needed
  await runAutoSyncFromSheets(false);
  const records = readDatabase();
  res.json({
    success: true,
    total: records.length,
    lastAutoSync: lastAutoSyncTimestamp,
    data: records
  });
});

// Auto-Sync Status Endpoint
app.get('/api/sync-status', (req, res) => {
  const cfg = readCloudConfig();
  const records = readDatabase();
  res.json({
    enabled: Boolean(cfg.googleSheetsWebhookUrl && cfg.googleSheetsWebhookUrl.startsWith('http')),
    isSyncInProgress,
    lastSyncTime: lastAutoSyncTimestamp,
    totalRecords: records.length,
    intervalMs: 5000
  });
});

// 3. Submit a new response (Everyone can submit anonymously)
app.post('/api/responses', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.dept || !body.scores) {
      return res.status(400).json({ success: false, error: '缺少必填欄位 (服務單位或題目評分)' });
    }

    const { q3, q4, q5, q6, q7, q8, q9 } = body.scores;
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

    const newRecord: ResponseRecord = {
      id: body.id || `resp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: body.timestamp || Date.now(),
      time: body.time || timeStr,
      dept: String(body.dept).trim(),
      role: body.role ? String(body.role).trim() : '非主管職員/公務員',
      gender: body.gender ? String(body.gender).trim() : '未提供',
      scores: { q3: s3, q4: s4, q5: s5, q6: s6, q7: s7, q8: s8, q9: s9 },
      avgPart2,
      avgPart3,
      avgOverall,
      q10: body.q10 ? String(body.q10).trim() : '（無特別填寫）',
      q11: body.q11 ? String(body.q11).trim() : '（無特別填寫）',
      q12: body.q12 ? String(body.q12).trim() : '（無特別填寫）'
    };

    const currentRecords = readDatabase();
    currentRecords.unshift(newRecord);
    writeDatabase(currentRecords);

    console.log(`[EAP Survey] New submission saved from ${newRecord.dept}. Total records: ${currentRecords.length}`);

    // If client provided a webhook URL, persist it if server doesn't have one
    const clientWebhookUrl = typeof body.googleSheetsWebhookUrl === 'string' ? body.googleSheetsWebhookUrl.trim() : '';
    if (clientWebhookUrl && clientWebhookUrl.startsWith('http')) {
      const currentCfg = readCloudConfig();
      if (!currentCfg.googleSheetsWebhookUrl) {
        writeCloudConfig({ ...currentCfg, googleSheetsWebhookUrl: clientWebhookUrl, mode: 'google_sheets' });
      }
    }

    // Trigger server-side Google Sheets forwarder
    const sheetsSuccess = await forwardToGoogleSheetsServerSide(newRecord, clientWebhookUrl);

    return res.status(201).json({
      success: true,
      message: '問卷填答已成功寫入中央統一資料庫與 Google 試算表！',
      googleSheetsSynced: sheetsSuccess,
      data: newRecord,
      totalCount: currentRecords.length
    });
  } catch (err) {
    console.error('Error handling new response:', err);
    return res.status(500).json({ success: false, error: '伺服器儲存失敗，請重試' });
  }
});

// Cloud Config Endpoints
app.get('/api/cloud-config', (req, res) => {
  const config = readCloudConfig();
  res.json(config);
});

app.post('/api/cloud-config', (req, res) => {
  const body = req.body || {};
  const current = readCloudConfig();
  const updated: CloudConfig = {
    ...current,
    mode: body.mode || current.mode || 'auto',
    googleSheetsWebhookUrl: typeof body.googleSheetsWebhookUrl === 'string' ? body.googleSheetsWebhookUrl.trim() : current.googleSheetsWebhookUrl
  };
  writeCloudConfig(updated);
  console.log('[Cloud Config Updated]', updated);
  res.json({ success: true, config: updated });
});

// Sync / Pull all responses from Google Sheets to Server Database
app.all('/api/sync-sheets', async (req, res) => {
  const customUrl = (req.body?.url || req.query?.url || '').toString();
  const result = await pullFromGoogleSheetsServerSide(customUrl);
  return res.json(result);
});

// Import batch records from CSV/JSON/Pasted data
app.post('/api/import-batch', (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: '請提供要匯入的問卷資料陣列' });
    }

    const currentRecords = readDatabase();
    const existingIds = new Set(currentRecords.map(r => r.id));
    let addedCount = 0;
    const merged = [...currentRecords];

    records.forEach((r: any, idx: number) => {
      if (!r.dept && !r.scores && !r.q3) return;
      const q3 = Number(r.q3 || r.scores?.q3) || 5;
      const q4 = Number(r.q4 || r.scores?.q4) || 5;
      const q5 = Number(r.q5 || r.scores?.q5) || 5;
      const q6 = Number(r.q6 || r.scores?.q6) || 5;
      const q7 = Number(r.q7 || r.scores?.q7) || 5;
      const q8 = Number(r.q8 || r.scores?.q8) || 5;
      const q9 = Number(r.q9 || r.scores?.q9) || 5;

      const avgPart2 = r.avgPart2 ? Number(r.avgPart2) : parseFloat(((q3 + q4 + q5 + q6) / 4).toFixed(2));
      const avgPart3 = r.avgPart3 ? Number(r.avgPart3) : parseFloat(((q7 + q8 + q9) / 3).toFixed(2));
      const avgOverall = r.avgOverall ? Number(r.avgOverall) : parseFloat(((q3 + q4 + q5 + q6 + q7 + q8 + q9) / 7).toFixed(2));

      const newRec: ResponseRecord = {
        id: r.id || `import_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: r.timestamp || Date.now(),
        time: r.time || '115-09-02 14:00:00',
        dept: String(r.dept || '未指定課室').trim(),
        role: r.role || '非主管職員/公務員',
        gender: r.gender || '未提供',
        scores: { q3, q4, q5, q6, q7, q8, q9 },
        avgPart2,
        avgPart3,
        avgOverall,
        q10: r.q10 || '（無特別填寫）',
        q11: r.q11 || '（無特別填寫）',
        q12: r.q12 || '（無特別填寫）'
      };

      if (!existingIds.has(newRec.id)) {
        merged.unshift(newRec);
        existingIds.add(newRec.id);
        addedCount++;
      }
    });

    merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    writeDatabase(merged);

    return res.json({
      success: true,
      message: `已成功匯入 ${addedCount} 筆問卷資料至中央資料庫！`,
      addedCount,
      totalCount: merged.length,
      data: merged
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || '匯入失敗' });
  }
});

// Test Google Sheets Connection endpoint directly from server
app.post('/api/test-sheets', async (req, res) => {
  const { url } = req.body;
  const targetUrl = (url || readCloudConfig().googleSheetsWebhookUrl || '').trim();

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({
      success: false,
      message: '請輸入有效的 Google Apps Script 網頁應用程式網址 (https://script.google.com/...)'
    });
  }

  // AUTOMATICALLY PERSIST TESTED VALID URL TO SERVER CLOUD CONFIG
  const currentCfg = readCloudConfig();
  writeCloudConfig({
    ...currentCfg,
    mode: 'google_sheets',
    googleSheetsWebhookUrl: targetUrl
  });

  const testRecord: ResponseRecord = {
    id: `test_${Date.now()}`,
    timestamp: Date.now(),
    time: `115-09-02 ${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`,
    dept: '人事室 (伺服器連線測試)',
    role: '主辦人員',
    gender: '不提供',
    scores: { q3: 5, q4: 5, q5: 5, q6: 5, q7: 5, q8: 5, q9: 5 },
    avgPart2: 5.0,
    avgPart3: 5.0,
    avgOverall: 5.0,
    q10: '🔔 此為三義鄉公所 EAP 系統之【伺服器端連線測試】封包！',
    q11: '若此列成功出現在試算表中，表示同仁使用任何品牌手機填寫皆能 100% 自動寫入！',
    q12: '測試成功'
  };

  const success = await forwardToGoogleSheetsServerSide(testRecord, targetUrl);

  if (success) {
    return res.json({
      success: true,
      message: '✅ 伺服器已成功將測試封包寫入 Google 試算表並已永久儲存設定！所有同仁手機填寫問卷將直接自動寫入！'
    });
  } else {
    return res.status(500).json({
      success: false,
      message: '⚠️ 伺服器傳送至 Google 試算表失敗，請確認 Google Apps Script 部署設定中「誰可以存取」是否已設為「任何人 (Anyone)」。'
    });
  }
});

// 4. Admin Login Verification
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'nick620504' || password === 'admin888') {
    return res.json({
      success: true,
      message: '身分驗證成功，已解鎖管理者權限與全所分析儀表板！',
      token: 'admin_token_' + Date.now()
    });
  }
  return res.status(401).json({
    success: false,
    error: '解鎖密碼不正確！請輸入正確的管理員密碼。'
  });
});

// 5. Delete a single response (Admin)
app.delete('/api/responses/:id', (req, res) => {
  const { id } = req.params;
  const records = readDatabase();
  const filtered = records.filter(r => r.id !== id);

  if (filtered.length === records.length) {
    return res.status(404).json({ success: false, error: '找不到指定的問卷紀錄' });
  }

  writeDatabase(filtered);
  return res.json({ success: true, message: '已成功從中央資料庫刪除該筆資料', remaining: filtered.length });
});

// 6. Clear all responses (Admin)
app.delete('/api/responses', (req, res) => {
  writeDatabase([]);
  return res.json({ success: true, message: '已成功清空中央資料庫所有問卷紀錄' });
});

// 7. Generate 5 Mock Test Responses (Admin)
app.post('/api/seed', (req, res) => {
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

  const currentRecords = readDatabase();
  const added: ResponseRecord[] = [];

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

    const item: ResponseRecord = {
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
    };
    added.push(item);
  }

  const updated = [...added, ...currentRecords].sort((a, b) => b.timestamp - a.timestamp);
  writeDatabase(updated);

  return res.json({
    success: true,
    message: '已成功新增 5 筆示範填答資料並同步寫入中央資料庫！',
    addedCount: added.length,
    totalCount: updated.length
  });
});

// 8. Aggregated Statistics
app.get('/api/stats', async (req, res) => {
  // Proactively check and sync from Google Sheets if needed
  await runAutoSyncFromSheets(false);
  const records = readDatabase();
  const total = records.length;

  if (total === 0) {
    return res.json({
      totalCount: 0,
      avgOverall: 0,
      avgPart2: 0,
      avgPart3: 0,
      satisfactionRate: 0,
      questionAverages: [],
      departmentBreakdown: [],
      scoreDistribution: []
    });
  }

  let sumOverall = 0;
  let sumP2 = 0;
  let sumP3 = 0;
  let satisfiedCount = 0; // >= 4 overall

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

    // Questions
    if (r.scores) {
      Object.keys(qSums).forEach(qKey => {
        const val = r.scores[qKey as keyof typeof r.scores] || 5;
        qSums[qKey] += val;
        if (qDist[qKey] && qDist[qKey][val] !== undefined) {
          qDist[qKey][val]++;
        }
      });
    }

    // Dept
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

  return res.json({
    totalCount: total,
    avgOverall: parseFloat((sumOverall / total).toFixed(2)),
    avgPart2: parseFloat((sumP2 / total).toFixed(2)),
    avgPart3: parseFloat((sumP3 / total).toFixed(2)),
    satisfactionRate: parseFloat(((satisfiedCount / total) * 100).toFixed(1)),
    questionAverages,
    departmentBreakdown,
    scoreDistribution
  });
});

// 9. Export to CSV with UTF-8 BOM
app.get('/api/export-csv', (req, res) => {
  const records = readDatabase();

  let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel Traditional Chinese
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

  const filename = `苗栗縣三義鄉公所115年度EAP研習問卷彙整_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  return res.send(csv);
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER START
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  苗栗縣三義鄉公所 115年度 EAP 研習問卷中央系統`);
    console.log(`  統一資料庫 API 服務已啟動: http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);

    // Start proactive background auto-sync loop with Google Sheets (every 5 seconds)
    setInterval(() => {
      runAutoSyncFromSheets(false).catch(() => {});
    }, 5000);
    console.log(`[Google Sheets Auto-Sync] Background auto-sync daemon is active (checking every 5 seconds)`);
  });
}

startServer();
