import apiClient from './client'
import type { ApiResponse, DashboardStats, AssessmentRecord } from '@career-assessment/shared'

export const adminApi = {
  // 登录
  login: (password: string) =
  apiClient.post<ApiResponse<{ token: string }>>('/admin/login', { password }),
  
  // 获取统计数据
  getStats: () =
  apiClient.get<ApiResponse<DashboardStats>>('/admin/stats'),
  
  // 获取测评列表
  getAssessments: (params?: { page?: number; pageSize?: number; status?: string }) =
  apiClient.get<ApiResponse<{ items: AssessmentRecord[]; total: number }>>('/admin/assessments', { params }),
  
  // 获取测评详情
  getAssessmentDetail: (id: string) =
  apiClient.get<ApiResponse>(`/admin/assessments/${id}`),
  
  // 更新审阅状态
  updateReviewStatus: (id: string, status: string) =
  apiClient.patch<ApiResponse>(`/admin/assessments/${id}/status`, { status }),
  
  // 发送邮件
  sendEmail: (assessmentId: string, data: { to: string; subject: string; body: string }) =
  apiClient.post<ApiResponse>(`/admin/assessments/${assessmentId}/send-email`, data),
  
  // 检查 SMTP 配置
  checkSmtpConfig: () =
  apiClient.get<ApiResponse<{ configured: boolean }>>('/admin/smtp/check'),
  
  // 更新 SMTP 配置
  updateSmtpConfig: (config: { host: string; port: number; secure: boolean; user: string; pass: string }) =
  apiClient.post<ApiResponse>('/admin/smtp/config', config),
  
  // 导出数据
  exportData: (format: 'pdf' | 'excel', ids?: string[]) =
  apiClient.post<Blob>('/admin/export', { format, ids }, { responseType: 'blob' }),
  
  // 修改密码
  changePassword: (oldPassword: string, newPassword: string) =
  apiClient.post<ApiResponse>('/admin/change-password', { oldPassword, newPassword })
}
