// 学历类型
export type Education = 'BACHELOR' | 'MASTER' | 'DOCTOR' | 'COLLEGE'

// 学历显示映射
export const EducationLabels: Record<Education, string> = {
  BACHELOR: '本科',
  MASTER: '硕士',
  DOCTOR: '博士',
  COLLEGE: '专科'
}

// 测评维度
export type Dimension = 
  | 'COMMUNICATION'
  | 'TEAMWORK'
  | 'PROBLEM_SOLVING'
  | 'LEARNING'
  | 'CAREER_AWARENESS'
  | 'INNOVATION'
  | 'TIME_MANAGEMENT'
  | 'EMOTIONAL'
  | 'LEADERSHIP'

// 维度显示映射
export const DimensionLabels: Record<Dimension, string> = {
  COMMUNICATION: '沟通表达',
  TEAMWORK: '团队协作',
  PROBLEM_SOLVING: '问题解决',
  LEARNING: '学习适应',
  CAREER_AWARENESS: '职业认知',
  INNOVATION: '创新思维',
  TIME_MANAGEMENT: '时间管理',
  EMOTIONAL: '情绪管理',
  LEADERSHIP: '领导力'
}

// 审阅状态
export type ReviewStatus = 'PENDING' | 'REVIEWED' | 'SENT'

export const ReviewStatusLabels: Record<ReviewStatus, string> = {
  PENDING: '待审阅',
  REVIEWED: '已审阅',
  SENT: '已发送'
}

// SMTP 配置
export interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 用户信息
export interface UserInfo {
  name: string
  major: string
  class: string
  email: string
  school: string
  phone: string
  education: Education
}

// 选项
export interface Option {
  id: string
  order: number
  content: string
  score: number
  dimension: Dimension
}

// 题目
export interface Question {
  id: string
  order: number
  scenario: string
  content: string
  options: Option[]
}

// 答案
export interface Answer {
  questionId: string
  optionId: string
}

// 维度得分
export interface DimensionScore {
  dimension: Dimension
  name: string
  score: number
  maxScore: number
}

// 测评结果
export interface AssessmentResult {
  id: string
  totalScore: number
  dimensionScores: DimensionScore[]
  rating: 'excellent' | 'good' | 'average' | 'needs_improvement'
  strengths: Dimension[]
  weaknesses: Dimension[]
}

// 测评记录
export interface AssessmentRecord {
  id: string
  userName: string
  userMajor: string
  userClass: string
  totalScore: number | null
  reviewStatus: ReviewStatus
  createdAt: string
}

// 统计数据
export interface DashboardStats {
  totalAssessments: number
  averageTotalScore: number
  averageCompletionTime: number
  dimensionAverages: Record<Dimension, number>
  scoreDistribution: {
    range: string
    count: number
  }[]
  majorDistribution: {
    major: string
    count: number
  }[]
}
