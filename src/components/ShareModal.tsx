import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getShareableSurveyUrl, getStoredCloudConfig } from '../services/cloudConfig';
import { Copy, Check, ExternalLink, QrCode, Sparkles, Smartphone, Shield, Cloud, AlertCircle } from 'lucide-react';

export const ShareModal: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const shareableUrl = getShareableSurveyUrl();
  const cloudConfig = getStoredCloudConfig();
  const hasSheets = Boolean(cloudConfig.googleSheetsWebhookUrl && cloudConfig.googleSheetsWebhookUrl.trim().length > 0);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Projector Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-stone-200 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-4">
          <QrCode className="w-4 h-4 text-emerald-600" />
          <span>研習現場投影專用 • 同仁手機掃描即填</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
          📱 手機掃碼填答 EAP 研習滿意度問卷
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto mt-2 leading-relaxed">
          請與會同仁開啟手機「相機」或「LINE 掃條碼」，對準下方 QR Code 即可免登入立即填答。所有問卷將即時寫入中央統一資料庫！
        </p>

        {/* Sync Status Badge */}
        {hasSheets ? (
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-bold border border-emerald-300">
            <Cloud className="w-3.5 h-3.5 text-emerald-700" />
            <span>已連結 Google 試算表：「115年三義鄉公所EAP研習問卷彙整」同步中</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs border border-stone-300">
            <span>💡 提示：可至「管理後台」設定 Google 試算表同步</span>
          </div>
        )}

        {/* QR Code Container */}
        <div className="my-8 inline-block p-6 bg-white rounded-3xl border-2 border-emerald-500/30 shadow-xl ring-8 ring-emerald-50/80">
          <QRCodeSVG
            value={shareableUrl}
            size={230}
            level="M"
            includeMargin={true}
            className="mx-auto rounded-xl"
          />
          <div className="text-[11px] font-mono font-bold text-emerald-800 mt-2">
            苗栗縣三義鄉公所 115年度 EAP 研習
          </div>
        </div>

        {/* Link Copy Bar */}
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl p-2 pl-3">
            <span className="text-xs text-stone-600 truncate flex-1 font-mono text-left" title={shareableUrl}>
              {shareableUrl}
            </span>
            <button
              id="copy-share-url-btn"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                copied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>已複製連結</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>複製問卷網址</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-stone-500 pt-2">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>免註冊免登入</span>
            </span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>支援全品牌手機</span>
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>即時同步試算表</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
