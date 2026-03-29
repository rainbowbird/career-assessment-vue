import apiClient from './client'
import type { ApiResponse, Question } from '@career-assessment/shared'

export const questionApi = {
  // 获取所有题目
  getQuestions: () =
  apiClient.get<ApiResponse<Question[]>>('/admin/questions'),
  
  // 获取单个题目
  getQuestion: (id: string) =
  apiClient.get<ApiResponse<Question>>(`/admin/questions/${id}`),
  
  // 创建题目
  createQuestion: (data: Partial<Question>) =
  apiClient.post<ApiResponse<Question>>('/admin/questions', data),
  
  // 更新题目
  updateQuestion: (id: string, data: Partial<Question>) =
  apiClient.put<ApiResponse<Question>>(`/admin/questions/${id}`, data),
  
  // 删除题目
  deleteQuestion: (id: string) =
  apiClient.delete<ApiResponse>(`/admin/questions/${id}`)
}
