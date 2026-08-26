import React, { useState } from 'react';
import { DEPARTMENTS, QUESTIONS, ROLES } from '../data/questions';
import { SurveyResponse } from '../types';
import { CheckCircle2, Send, Sparkles, ShieldCheck, HeartHandshake, RefreshCw, BarChart2 } from 'lucide-react';

interface SurveyFormProps {
  onSuccess: (newRecord: SurveyResponse, totalCount: number) => void;
  onViewAnalytics: () => void;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ onSuccess, onViewAnalytics }) => {
  const [dept, setDept] = useState('');
  const [role, setRole] = useState('');
  const [gender, setGender] = useState('');
  
  // Default all ratings to 5
  const [scores, setScores] = useState<Record<string, number>>({
    q3: 5,
    q4: 5,
    q5: 5,
    q6: 5,
    q7: 5,
    q8: 5,
    q9: 5,
  });

  const [q10, setQ10] = useState('');
  const [q11, setQ11] = useState('');
  const [q12, setQ12] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    record: SurveyResponse;
    totalCount: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute live averages
  const avgP2 = parseFloat(
    ((scores.q3 + scores.q4 + scores.q5 + scores.q6) / 4).toFixed(2)
  );
  const avgP3 = parseFloat(
    ((scores.q7 + scores.q8 + scores.q9) / 3).toFixed(2)
  );
  const avgOverall = parseFloat(
    ((scores.q3 + scores.q4 + scores.q5 + scores.q6 + scores.q7 + scores.q8 + scores.q9) / 7).toFixed(2)
  );

  const handleScoreChange = (qId: string, val: number) => {
    setScores((prev) => ({ ...prev, [qId]: val }));
  };

  const setAllScores = (val: number) => {
    setScores({
      q3: val,
      q4: val,
      q5: val,
      q6: val,
      q7: val,
      q8: val,
      q9: val,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!dept) {
      setErrorMsg('請選擇您的服務單位');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        dept,
        role: role || undefined,
        gender: gender || undefined,
        scores,
        q10: q10.trim() || '（無特別填寫）',
        q11: q11.trim() || '（無特別填寫）',
        q12: q12.trim() || '（無特別填寫）'
      };

      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.success && json.data) {
        setSubmittedData({
          record: json.data,
          totalCount: json.totalCount
        });
        onSuccess(json.data, json.totalCount);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMsg(json.error || '問卷提交失敗，請檢查網路後再試');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMsg('連線中央資料庫發生問題，請稍候重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForAnotherSubmission = () => {
    setDept('');
    setRole('');
    setGender('');
    setScores({ q3: 5, q4: 5, q5: 5, q6: 5, q7: 5, q8: 5, q9: 5 });
    setQ10('');
    setQ11('');
    setQ12('');
    setSubmittedData(null);
    setErrorMsg(null);
  };

  // If submitted successfully, show confirmation card
  if (submittedData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-md border border-emerald-200 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500"></div>

          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            已同步寫入伺服器統一中央資料庫
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-2">
            感謝您！問卷已成功送出
          </h2>
          <p className="text-stone-600 text-sm max-w-lg mx-auto leading-relaxed mb-6">
            您的寶貴意見已安全記錄並彙整至苗栗縣三義鄉公所 115年度 EAP 研習中央資料庫，將作為未來辦理員工心理健康與協助方案之重要參考依據。
          </p>

          {/* Submission Receipt Details */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left max-w-md mx-auto space-y-2.5 text-xs text-stone-700 mb-8">
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="font-bold text-stone-600">填答流水序號</span>
              <span className="font-mono font-bold text-emerald-800">{submittedData.record.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">服務單位</span>
              <span className="font-semibold text-stone-800">{submittedData.record.dept}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">填答時間</span>
              <span className="font-mono text-stone-700">{submittedData.record.time}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">本次評分總均分</span>
              <span className="font-bold text-emerald-700 text-sm">{submittedData.record.avgOverall} 分 (滿分5分)</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-stone-200">
              <span className="text-stone-500">全所累積已填答</span>
              <span className="font-black text-amber-700 text-sm">{submittedData.totalCount} 份</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <button
              id="view-analytics-from-success"
              onClick={onViewAnalytics}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
            >
              <BarChart2 className="w-4 h-4" />
              <span>檢視全所即時分析儀表板</span>
            </button>
            <button
              id="fill-another-survey-btn"
              onClick={resetForAnotherSubmission}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 px-6 rounded-xl border border-stone-300 transition flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>填寫下一份問卷</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200/90 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-5 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Sanyi Township Office • EAP Survey
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                ✍️ 研習課後滿意度問卷填答
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/80 text-xs text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>匿名填答 • 即時彙整雲端統一資料庫</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          各位同仁您好：感謝您參加本次三義鄉公所 115年度員工協助方案專題研習。本問卷採完全匿名方式進行，請依您的真實感受填寫。所有填答資料將即時寫入<b>伺服器統一資料庫</b>，作為日後規劃相關身心健康活動及講師評鑑之重要參考。
        </p>

        {errorMsg && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: 基本資料 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200/90 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-emerald-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs flex items-center justify-center font-black">
                1
              </span>
              <span>第一部分：基本資料</span>
            </h3>
            <span className="text-[11px] text-stone-500 font-medium">
              <span className="text-red-500">*</span> 為必填項目
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Department */}
            <div className="sm:col-span-1">
              <label htmlFor="dept-select" className="block text-xs font-bold text-stone-800 mb-1.5">
                1. 您的服務課室單位 <span className="text-red-500">*</span>
              </label>
              <select
                id="dept-select"
                required
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-sm font-medium text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              >
                <option value="" disabled>
                  -- 請選擇服務課室 --
                </option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Role (Optional) */}
            <div className="sm:col-span-1">
              <label htmlFor="role-select" className="block text-xs font-bold text-stone-800 mb-1.5">
                2. 身分別 (選填)
              </label>
              <select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              >
                <option value="">-- 請選擇身分 (選填) --</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender (Optional) */}
            <div className="sm:col-span-1">
              <label htmlFor="gender-select" className="block text-xs font-bold text-stone-800 mb-1.5">
                3. 性別 (選填)
              </label>
              <select
                id="gender-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              >
                <option value="">-- 請選擇性別 (選填) --</option>
                <option value="女性">女性</option>
                <option value="男性">男性</option>
                <option value="不透露">不透露</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2 & 3: Rating Scale Questions */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-emerald-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs flex items-center justify-center font-black">
                  2
                </span>
                <span>第二與三部分：課程內容與講師表現滿意度評分 (1 ~ 5 分)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                評分標準：1分(非常不同意) ➔ 5分(非常同意)
              </p>
            </div>

            {/* Quick Set All Button */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs">
              <span className="text-stone-500 text-[11px] px-2 font-medium">快速全填：</span>
              <button
                type="button"
                onClick={() => setAllScores(5)}
                className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition"
              >
                全部5分
              </button>
              <button
                type="button"
                onClick={() => setAllScores(4)}
                className="px-2.5 py-1 rounded-lg bg-white text-stone-700 hover:bg-stone-200 border border-stone-300 font-bold transition"
              >
                全部4分
              </button>
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-4">
            {QUESTIONS.map((q) => {
              const currentScore = scores[q.id] || 5;

              return (
                <div
                  key={q.id}
                  id={`question-card-${q.id}`}
                  className="bg-stone-50/80 rounded-2xl p-4 sm:p-5 border border-stone-200 transition-all hover:border-emerald-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {q.category === 'course' ? '課程內容' : '講師表現'}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                        {q.num}. {q.text}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-mono shadow-sm">
                      {currentScore} 分
                    </span>
                  </div>

                  {/* 1-5 Score Buttons */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = currentScore === val;
                      const labels = ['', '非常不同意', '不同意', '普通', '同意', '非常同意'];

                      return (
                        <button
                          key={val}
                          type="button"
                          id={`score-btn-${q.id}-${val}`}
                          onClick={() => handleScoreChange(q.id, val)}
                          className={`py-2.5 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-600 ring-offset-1'
                              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                          }`}
                        >
                          <span className="text-sm sm:text-base font-black">{val} 分</span>
                          <span className={`text-[10px] hidden sm:inline ${isSelected ? 'text-emerald-100 font-medium' : 'text-stone-400'}`}>
                            {labels[val]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Score Preview Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-950">即時平均試算：</span>
            </div>
            <div className="flex flex-wrap gap-4 font-semibold">
              <span className="text-stone-700">
                課程實用均分：<b className="text-emerald-800 text-sm">{avgP2}</b>
              </span>
              <span className="text-stone-700">
                講師滿意均分：<b className="text-emerald-800 text-sm">{avgP3}</b>
              </span>
              <span className="text-emerald-950 font-bold bg-emerald-200/60 px-2.5 py-0.5 rounded-lg">
                整體總滿意度：<b className="text-emerald-900 text-sm">{avgOverall}</b> / 5.0
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: 開放式寶貴意見 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200/90 space-y-5">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-emerald-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs flex items-center justify-center font-black">
                3
              </span>
              <span>第四部分：開放式寶貴意見與改進建議</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              您的真實意見是公所持續進步與提供優質同仁協助的重要養分
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="q10-input" className="block text-xs font-bold text-stone-800 mb-1.5">
                10. 參加這堂課最大的收穫或心得：
              </label>
              <textarea
                id="q10-input"
                rows={2}
                value={q10}
                onChange={(e) => setQ10(e.target.value)}
                placeholder="例如：講師分享的情緒急救技巧很實用、面對民眾時更能保持平靜、學會呼吸調節..."
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs sm:text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              ></textarea>
            </div>

            <div>
              <label htmlFor="q11-input" className="block text-xs font-bold text-stone-800 mb-1.5">
                11. 對本次研習安排或設施設備之改進建議：
              </label>
              <textarea
                id="q11-input"
                rows={2}
                value={q11}
                onChange={(e) => setQ11(e.target.value)}
                placeholder="例如：會議室溫度、投影片字體大小、時間長度安排或演練互動建議..."
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs sm:text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              ></textarea>
            </div>

            <div>
              <label htmlFor="q12-input" className="block text-xs font-bold text-stone-800 mb-1.5">
                12. 未來期待公所舉辦之其他 EAP 主題講座或身心健康活動：
              </label>
              <textarea
                id="q12-input"
                rows={2}
                value={q12}
                onChange={(e) => setQ12(e.target.value)}
                placeholder="例如：公務壓力與正念減壓、職場人際溝通、睡眠障礙改善、家庭親子關係、公務員理財與退休規劃..."
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs sm:text-sm text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="submit-survey-btn"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base text-white shadow-xl transition-all flex items-center justify-center gap-3 ${
              isSubmitting
                ? 'bg-emerald-900 cursor-not-allowed opacity-80'
                : 'bg-emerald-700 hover:bg-emerald-800 hover:shadow-2xl active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>資料寫入中央資料庫中，請稍候...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>🚀 確認送出問卷（即時寫入伺服器統一中央資料庫）</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
