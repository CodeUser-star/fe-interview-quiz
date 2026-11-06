/** 题库 / 作答数据模型 —— 严格对应需求规格 v1.1 第四节 Schema */

export type QuestionType = 'single' | 'multi' | 'judge' | 'short' | 'code'
export type Subject = 'js' | 'css' | 'vue' | 'browser' | 'network' | 'os' | 'db' | 'algo'
export type Difficulty = 1 | 2 | 3
export type WrongReason = 'unknown' | 'careless'
export type ThemeMode = 'system' | 'dark' | 'light'

export interface Question {
  id: string
  type: QuestionType
  subject: Subject
  difficulty: Difficulty
  tags: string[]
  title: string
  options?: string[]
  /** single: [0] · multi: [0,2] · judge: true/false */
  answer?: number[] | boolean
  analysis: string
  points?: string[]
  followups?: string[]
  approach?: string
  complexity?: string
  link?: string
}

export interface AnswerRecord {
  qid: string
  ts: number
  /** 自动判分是否答对；自判题为「是否掌握」 */
  correct: boolean
  /** 是否由自己判定（short / code） */
  self: boolean
}

export interface ReviewItem {
  qid: string
  /** 已成功复习次数，0 表示刚入队 */
  stage: number
  dueAt: number
  addedAt: number
  /** 最后一次变更时间，供跨端 LWW 合并使用（旧数据可能缺失） */
  updatedAt?: number
  wrongReason?: WrongReason
}

export interface SessionResult {
  qid: string
  correct: boolean
}

export type SessionMode = 'bank' | 'tag' | 'quick' | 'review'

export interface Session {
  id: string
  mode: SessionMode
  label: string
  tag?: string
  qids: string[]
  index: number
  results: SessionResult[]
  startedAt: number
}

export interface Settings {
  theme: ThemeMode
  /** 打卡所需的当日答题数 */
  dailyGoal: number
  /** WebDAV 同步配置（密码明文存本机 localStorage，仅自用） */
  syncUrl: string
  syncUser: string
  syncPass: string
}

export interface Meta {
  stars: Record<string, number>
  notes: Record<string, string>
  /** 每条笔记的最后修改时间戳，用于同步时 last-write-wins 合并 */
  noteTs?: Record<string, number>
}

/** 打卡记录：日期串 → 时间戳 */
export type Checkins = Record<string, number>

export const SUBJECTS: { key: Subject; name: string }[] = [
  { key: 'js', name: 'JavaScript' },
  { key: 'css', name: 'CSS' },
  { key: 'vue', name: 'Vue' },
  { key: 'browser', name: '浏览器' },
  { key: 'network', name: '计网' },
  { key: 'os', name: '操作系统' },
  { key: 'db', name: '数据库' },
  { key: 'algo', name: '算法' },
]

export const SUBJECT_NAME: Record<Subject, string> = {
  js: 'JavaScript',
  css: 'CSS',
  vue: 'Vue',
  browser: '浏览器',
  network: '计网',
  os: '操作系统',
  db: '数据库',
  algo: '算法',
}

/** 筛选 chip 用的短名，避免一行塞不下 */
export const SUBJECT_SHORT: Record<Subject, string> = {
  js: 'JS',
  css: 'CSS',
  vue: 'Vue',
  browser: '浏览器',
  network: '计网',
  os: '系统',
  db: '数据库',
  algo: '算法',
}

export const TYPE_NAME: Record<QuestionType, string> = {
  single: '单选',
  multi: '多选',
  judge: '判断',
  short: '简答',
  code: '手撕',
}

export const DIFFICULTY_NAME: Record<Difficulty, string> = {
  1: '简单',
  2: '中等',
  3: '困难',
}

export const TAG_NAME: Record<string, string> = {
  'nowcoder-hot': '牛客高频',
  'bytedance-r1': '字节一面',
  'bytedance-r2': '字节二面',
  'tencent-r1': '腾讯一面',
  'meituan-r1': '美团一面',
  'lc-hot100': 'LC 热题100',
  'js-handwrite': 'JS 手写',
  'vue-core': 'Vue 核心',
  'css-layout': 'CSS 布局',
  'browser-core': '浏览器核心',
  'network-core': '计网核心',
  'must-know': '必背',
  'project': '项目延伸',
}

export function tagLabel(tag: string): string {
  return TAG_NAME[tag] ?? tag
}
