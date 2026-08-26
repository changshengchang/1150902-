import React from 'react';
import { AggregateStats, SurveyResponse } from '../types';
import { SEMINAR_INFO } from '../data/questions';
import { Printer, X, FileText, CheckCircle2, Download } from 'lucide-react';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AggregateStats | null;
  responses: SurveyResponse[];
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  stats,
  responses
}) => {
  if (!isOpen || !stats) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    window.location.href = '/api/export-csv';
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-300 print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">
              苗栗縣三義鄉公所 115年度 EAP 研習滿意度分析成果報告摘要
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>列印 / 存為 PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下載 CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-emerald-800 text-stone-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 text-stone-800 space-y-6 print:p-0 print:overflow-visible">
          {/* Official Document Header */}
          <div className="border-b-2 border-stone-800 pb-4 text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-stone-950 tracking-wider">
              苗栗縣三義鄉公所 研習成果報告書
            </h1>
            <h2 className="text-base sm:text-lg font-bold text-emerald-900">
              115年度員工協助方案(EAP)「職場心理健康急救與自我調適」研習滿意度調查彙整
            </h2>
            <div className="text-xs text-stone-500 flex flex-wrap justify-center gap-4 pt-1 font-medium">
              <span>主辦單位：人事室</span>
              <span>合辦單位：苗栗市社區心理衛生中心</span>
              <span>研習日期：115年9月2日</span>
              <span>報告產出日期：115年9月2日</span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-stone-900 border-l-4 border-emerald-700 pl-2">
              壹、研習成效綜合評估摘要
            </h3>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs leading-relaxed space-y-2">
              <p>
                本所為落實公務同仁心理健康照護及推展員工協助方案(EAP)，特於 115年9月2日
                辦理「職場心理健康急救與自我調適」講座，聘請中華民國康復之友聯盟秘書長
                <b> 張朝翔 職能治療師 </b>蒞所主講。
              </p>
              <p>
                研習結束後採手機匿名填答課後滿意度問卷，全所共回收有效問卷 <b>{stats.totalCount}</b> 份。
                整體滿意度平均得分高達 <b>{stats.avgOverall} 分</b>（滿分5分），滿意度達成率（4~5分比例）達 <b>{stats.satisfactionRate}%</b>，
                顯著超越公務 EAP 目標基準（80%），顯示同仁對本次課程內容規劃、實用調適技巧及講師專業表達均給予極高肯定。
              </p>
            </div>
          </div>

          {/* Section 2: Key Indicators Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-stone-900 border-l-4 border-emerald-700 pl-2">
              貳、全所核心滿意度量化指標統計
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50">
                <div className="text-[11px] text-stone-500">有效填答總人數</div>
                <div className="text-xl font-bold text-stone-900 font-mono mt-0.5">
                  {stats.totalCount} 份
                </div>
              </div>
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50">
                <div className="text-[11px] text-stone-500">課程實用性均分</div>
                <div className="text-xl font-bold text-emerald-800 font-mono mt-0.5">
                  {stats.avgPart2} 分
                </div>
              </div>
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50">
                <div className="text-[11px] text-stone-500">講師專業表現均分</div>
                <div className="text-xl font-bold text-emerald-800 font-mono mt-0.5">
                  {stats.avgPart3} 分
                </div>
              </div>
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50">
                <div className="text-[11px] text-stone-500">總體滿意度平均</div>
                <div className="text-xl font-bold text-amber-700 font-mono mt-0.5">
                  {stats.avgOverall} 分
                </div>
              </div>
            </div>

            {/* Question Breakdown Table */}
            <div className="overflow-x-auto rounded-xl border border-stone-200 mt-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-2.5 w-12 text-center">題號</th>
                    <th className="p-2.5">評估指標向度</th>
                    <th className="p-2.5 w-20 text-center">類別</th>
                    <th className="p-2.5 w-24 text-center">全所平均得分</th>
                    <th className="p-2.5 w-28 text-center">成效等級</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {stats.questionAverages.map((q) => (
                    <tr key={q.id}>
                      <td className="p-2.5 text-center font-bold font-mono">{q.id.toUpperCase()}</td>
                      <td className="p-2.5 font-medium">{q.label}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 font-semibold">
                          {q.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-800 font-mono text-sm">
                        {q.avg} 分
                      </td>
                      <td className="p-2.5 text-center text-[11px] font-bold text-emerald-700">
                        {q.avg >= 4.5 ? '極為優良' : '優良'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Department Breakdown */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-stone-900 border-l-4 border-emerald-700 pl-2">
              參、各課室同仁填答分佈狀況
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {stats.departmentBreakdown.map((d) => (
                <div key={d.dept} className="bg-stone-50 border border-stone-200 p-2 rounded-lg flex justify-between">
                  <span className="font-semibold text-stone-700">{d.dept}</span>
                  <span className="font-bold text-emerald-800 font-mono">{d.count} 份 ({d.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Qualitative Feedback Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-stone-900 border-l-4 border-emerald-700 pl-2">
              肆、同仁代表性心得收穫與具體建議摘錄
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                <div className="font-bold text-emerald-900">一、主要收穫與心得摘錄：</div>
                <ul className="list-disc list-inside text-stone-600 space-y-0.5 pl-1">
                  {responses.slice(0, 4).map((r, i) => (
                    <li key={i}>{r.q10} （{r.dept}）</li>
                  ))}
                </ul>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                <div className="font-bold text-purple-900">二、未來期待舉辦之其他 EAP 主題：</div>
                <ul className="list-disc list-inside text-stone-600 space-y-0.5 pl-1">
                  {responses.slice(0, 4).map((r, i) => (
                    <li key={i}>{r.q12}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sign-off / Signature section for official filing */}
          <div className="pt-8 border-t border-stone-300 grid grid-cols-3 gap-4 text-center text-xs text-stone-700 font-bold">
            <div className="space-y-8">
              <div>承辦人</div>
              <div className="border-b border-stone-400 mx-6"></div>
            </div>
            <div className="space-y-8">
              <div>人事室主任</div>
              <div className="border-b border-stone-400 mx-6"></div>
            </div>
            <div className="space-y-8">
              <div>鄉長 / 秘書</div>
              <div className="border-b border-stone-400 mx-6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
