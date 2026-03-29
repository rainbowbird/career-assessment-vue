import apiClient from './client'
import type { ApiResponse, Question, UserInfo } from '@career-assessment/shared'

export const assessmentApi = {
  // 获取题目列表
  getQuestions: () =
  apiClient.get<ApiResponse<Question[]>>('/questions'),
  
  // 创建测评
  createAssessment: (userInfo: UserInfo) =
  apiClient.post<ApiResponse<{ id: string }>>('/assessments', userInfo),
  
  // 提交答案
  submitAnswer: (assessmentId: string, questionId: string, optionId: string) =
  apiClient.post<ApiResponse>(`/assessments/${assessmentId}/answers`, {
    questionId,
    optionId
  }),
  
  // 完成测评
  completeAssessment: (assessmentId: string) =
  apiClient.post<ApiResponse>(`/assessments/${assessmentId}/complete`),
  
  // 获取测评结果
  getResult: (assessmentId: string) =
  apiClient.get<ApiResponse>(`/assessments/${assessmentId}/result`)
}
