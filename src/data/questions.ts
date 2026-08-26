import { QuestionItem } from '../types';

export const DEPARTMENTS = [
  '民政課',
  '財行課',
  '建設課',
  '觀農課',
  '社福課',
  '主計室',
  '人事室',
  '政風室',
  '清潔隊',
  '圖書館',
  '市場'
];

export const ROLES = [
  '非主管職員/公務員',
  '主管/課室長官',
  '約聘僱/臨時人員',
  '工友/技工/清潔隊員',
  '其他'
];

export const QUESTIONS: QuestionItem[] = [
  {
    id: 'q3',
    part: 2,
    num: '3',
    category: 'course',
    text: '本次講座主題（職場心理急救與自我調適）符合我的實際公務壓力與身心照顧需求。',
    shortLabel: '主題符合需求'
  },
  {
    id: 'q4',
    part: 2,
    num: '4',
    category: 'course',
    text: '課程內容傳授之情緒調適技巧與心理急救觀念具實用性，有助於預防職場過勞耗損。',
    shortLabel: '技巧具實用性'
  },
  {
    id: 'q5',
    part: 2,
    num: '5',
    category: 'course',
    text: '本課程有助於提升我在面對高壓民眾或繁瑣業務時的情緒調適與自控能力。',
    shortLabel: '提升情緒自控'
  },
  {
    id: 'q6',
    part: 2,
    num: '6',
    category: 'course',
    text: '課程簡報及內容安排明確清晰，易於理解吸收。',
    shortLabel: '簡報明確清晰'
  },
  {
    id: 'q7',
    part: 3,
    num: '7',
    category: 'lecturer',
    text: '講師（張朝翔 職能治療師）專業知識豐富，對主題剖析深入透徹。',
    shortLabel: '講師專業透徹'
  },
  {
    id: 'q8',
    part: 3,
    num: '8',
    category: 'lecturer',
    text: '講師授課方式生動活潑、條理分明，能引發學習興趣。',
    shortLabel: '授課生動活潑'
  },
  {
    id: 'q9',
    part: 3,
    num: '9',
    category: 'lecturer',
    text: '講師能有效解答學員提問（如綜合討論與回饋時間），互動良好。',
    shortLabel: '互動答疑良好'
  }
];

export const SEMINAR_INFO = {
  title: '苗栗縣三義鄉公所 115年度員工協助方案 (EAP)',
  topic: '「職場心理健康急救與自我調適」研習專題講座',
  date: '115年9月2日（星期二）10:00 - 12:10',
  location: '苗栗縣三義鄉公所三樓大會議室',
  organizer: '苗栗縣三義鄉公所 人事室',
  coOrganizer: '苗栗市社區心理衛生中心',
  targetAudience: '本所各課室全體公務同仁、約聘僱人員、臨時人員及相關同仁',
  speaker: {
    name: '張朝翔 職能治療師',
    title: '中華民國康復之友聯盟 秘書長',
    expertise: '職場心理急救、身心壓力自我調適、公務溝通技巧、過勞預防與心理彈性建立',
    intro: '具備豐富之精神心理衛生與社區復健實務經驗，長期協助各級公務機關與企業推展員工心理協助方案 (EAP)，教學風格幽默生動、兼具學理與落地實務演練。'
  }
};
