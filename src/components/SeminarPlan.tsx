import React from 'react';
import { SEMINAR_INFO } from '../data/questions';
import { Calendar, Clock, MapPin, Building, UserCheck, GraduationCap, Award, BookOpen } from 'lucide-react';

export const SeminarPlan: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <BookOpen className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Official EAP Seminar Plan
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
          {SEMINAR_INFO.title}
        </h2>
        <p className="text-base sm:text-lg font-bold text-emerald-800 mt-1">
          {SEMINAR_INFO.topic}
        </p>
      </div>

      {/* Plan Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 border-l-4 border-emerald-600 pl-2.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>研習基本資訊與規劃</span>
          </h3>

          <div className="space-y-3 text-xs sm:text-sm text-stone-700">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-stone-900">辦理時間：</span>
                <span>{SEMINAR_INFO.date}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-stone-900">研習地點：</span>
                <span>{SEMINAR_INFO.location}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Building className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-stone-900">主辦單位：</span>
                <span>{SEMINAR_INFO.organizer}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Award className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-stone-900">合辦單位：</span>
                <span>{SEMINAR_INFO.coOrganizer}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-stone-900">參加對象：</span>
                <span>{SEMINAR_INFO.targetAudience}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lecturer Bio */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 border-l-4 border-emerald-600 pl-2.5 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <span>授課講座講師簡介</span>
          </h3>

          <div className="space-y-2.5 text-xs sm:text-sm text-stone-700">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-inner">
                張
              </div>
              <div>
                <div className="font-black text-stone-900 text-base">
                  {SEMINAR_INFO.speaker.name}
                </div>
                <div className="text-xs text-emerald-700 font-semibold">
                  {SEMINAR_INFO.speaker.title}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 space-y-2 text-xs leading-relaxed">
              <div>
                <span className="font-bold text-stone-900">專業專長領域：</span>
                <p className="text-stone-600 mt-0.5">{SEMINAR_INFO.speaker.expertise}</p>
              </div>
              <div>
                <span className="font-bold text-stone-900">授課風格與實務背景：</span>
                <p className="text-stone-600 mt-0.5">{SEMINAR_INFO.speaker.intro}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Schedule Outline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
        <h3 className="text-sm font-bold text-stone-900 border-l-4 border-emerald-600 pl-2.5">
          📅 課程大綱與時間流程表
        </h3>

        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3 w-28">時間</th>
                <th className="p-3">課程單元與核心內容</th>
                <th className="p-3 w-32">授課重點</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              <tr className="hover:bg-stone-50">
                <td className="p-3 font-mono font-bold text-emerald-800">10:00 - 10:10</td>
                <td className="p-3 font-semibold">長官致詞與 EAP 研習引言</td>
                <td className="p-3 text-stone-500">鄉長 / 主任致詞</td>
              </tr>
              <tr className="hover:bg-stone-50">
                <td className="p-3 font-mono font-bold text-emerald-800">10:10 - 11:00</td>
                <td className="p-3">
                  <div className="font-bold text-stone-900">單元一：公務職場壓力源識別與心理急救三部曲</div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    • 面對民眾陳情與高壓業務時的身心生理反應<br />
                    • 「停、看、聽」情緒急救法與即時腹式呼吸調息
                  </div>
                </td>
                <td className="p-3 text-stone-600 font-medium">實務技巧演練</td>
              </tr>
              <tr className="hover:bg-stone-50">
                <td className="p-3 font-mono font-bold text-emerald-800">11:00 - 11:10</td>
                <td className="p-3 font-semibold text-stone-500">身心休息與茶敘交流</td>
                <td className="p-3 text-stone-400">中場休息</td>
              </tr>
              <tr className="hover:bg-stone-50">
                <td className="p-3 font-mono font-bold text-emerald-800">11:10 - 11:50</td>
                <td className="p-3">
                  <div className="font-bold text-stone-900">單元二：同仁身心自我調適與同儕關懷互助網絡</div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    • 職場過勞前兆檢測與認知重塑 (Cognitive Reframing)<br />
                    • 善用公所 EAP 諮商資源與外部心理支持管道
                  </div>
                </td>
                <td className="p-3 text-stone-600 font-medium">情境案例分析</td>
              </tr>
              <tr className="hover:bg-stone-50">
                <td className="p-3 font-mono font-bold text-emerald-800">11:50 - 12:10</td>
                <td className="p-3">
                  <div className="font-bold text-stone-900">單元三：綜合座談、學員提問互動與課後滿意度調查</div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    • 現場學員提問與實務解答<br />
                    • 手機掃描 QR Code 填寫課後滿意度問卷（即時同步中央資料庫）
                  </div>
                </td>
                <td className="p-3 text-emerald-700 font-bold">滿意度問卷填答</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
