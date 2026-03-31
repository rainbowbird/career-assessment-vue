<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <nav class="bg-white shadow-md sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-chart-line text-primary text-2xl"></i>
          <span class="text-lg font-bold">测评记录</span>
        </div>
        <div class="flex items-center space-x-4">
          <router-link
            to="/admin"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            <i class="fa-solid fa-tachometer-alt mr-1"></i> 仪表板
          </router-link>
          <button
            @click="logout"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            <i class="fa-solid fa-sign-out-alt mr-1"></i> 退出
          </button>
        </div>
      </div>
    </nav>

    <main class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- 筛选和导出 -->
      <div class="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <select
            v-model="filterStatus"
            @change="loadAssessments"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待审阅</option>
            <option value="REVIEWED">已审阅</option>
            <option value="SENT">已发送</option>
          </select>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            @click="exportData('excel')"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200"
          >
            <i class="fa-solid fa-file-excel mr-1"></i> 导出 Excel
          </button>
          <button
            @click="exportData('pdf')"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
          >
            <i class="fa-solid fa-file-pdf mr-1"></i> 导出 PDF
          </button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="py-3 px-4 text-left text-xs font-medium text-neutral uppercase tracking-wider">姓名</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-neutral uppercase tracking-wider">专业</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-neutral uppercase tracking-wider">班级</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-neutral uppercase tracking-wider">总分</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-neutral uppercase tracking-wider">测评日期</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-neutral uppercase tracking-wider">状态</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-neutral uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="assessment in assessments" :key="assessment.id" class="hover:bg-gray-50">
                <td class="py-3 px-4">{{ assessment.userName }}</td>
                <td class="py-3 px-4">{{ assessment.userMajor }}</td>
                <td class="py-3 px-4">{{ assessment.userClass }}</td>
                <td class="py-3 px-4 font-medium">{{ assessment.totalScore || '-' }}</td>
                <td class="py-3 px-4 text-sm text-neutral">{{ formatDate(assessment.createdAt) }}</td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="getStatusClass(assessment.reviewStatus)"
                  >
                    {{ getStatusLabel(assessment.reviewStatus) }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <router-link
                      :to="`/admin/assessments/${assessment.id}`"
                      class="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-all"
                    >
                      查看
                    </router-link>

                    <button
                      @click="openEmailModal(assessment)"
                      class="px-3 py-1 bg-secondary text-white text-sm rounded hover:bg-secondary/90 transition-all"
                    >
                      发送邮件
                    </button>

                    <button
                      @click="confirmDelete(assessment)"
                      class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-all"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
              
              <tr v-if="assessments.length === 0">
                <td colspan="7" class="py-8 text-center text-neutral">
                  暂无测评记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
          <div class="text-sm text-neutral">
            共 {{ total }} 条记录，第 {{ currentPage }}/{{ totalPages }} 页
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/api/admin'
import { ReviewStatusLabels, DimensionLabels } from '@career-assessment/shared'
import type { AssessmentRecord } from '@career-assessment/shared'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const router = useRouter()
const authStore = useAuthStore()

// 状态
const assessments = ref<AssessmentRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterStatus = ref('')
const isLoading = ref(false)
const exportingId = ref<string | null>(null)

// 计算属性
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 方法
const loadAssessments = async () => {
  try {
    isLoading.value = true
    const response = await adminApi.getAssessments({
      page: currentPage.value,
      pageSize: pageSize.value,
      status: filterStatus.value || undefined
    })
    
    if (response.data.success && response.data.data) {
      assessments.value = response.data.data.items
      total.value = response.data.data.total
    }
  } catch (error) {
    console.error('加载测评记录失败:', error)
  } finally {
    isLoading.value = false
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadAssessments()
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const getStatusLabel = (status: string) => {
  return ReviewStatusLabels[status as keyof typeof ReviewStatusLabels] || status
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'REVIEWED':
      return 'bg-blue-100 text-blue-800'
    case 'SENT':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const openEmailModal = (assessment: AssessmentRecord) => {
  // TODO: 实现邮件发送弹窗
  alert(`发送邮件给: ${assessment.userName}`)
}

// 导出单个测评为 PDF
const exportSinglePDF = async (assessment: AssessmentRecord) => {
  if (exportingId.value) return

  exportingId.value = assessment.id

  try {
    // 获取测评详情
    const response = await adminApi.getAssessmentDetail(assessment.id)
    if (!response.data.success || !response.data.data) {
      alert('获取测评数据失败')
      return
    }

    const detail = response.data.data
    const userName = detail.user.name

    // 创建临时容器
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 800px;
      padding: 40px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    `

    // 获取评级
    const totalScore = detail.totalScore || 0
    let ratingText = ''
    if (totalScore >= 90) ratingText = '优秀'
    else if (totalScore >= 80) ratingText = '良好'
    else if (totalScore >= 70) ratingText = '中等'
    else ratingText = '待提升'

    // 构建维度得分 HTML
    const dimensionScores = detail.dimensionScores || {}
    const dimensions = [
      { key: 'COMMUNICATION', label: '沟通表达' },
      { key: 'TEAMWORK', label: '团队协作' },
      { key: 'PROBLEM_SOLVING', label: '问题解决' },
      { key: 'LEARNING', label: '学习适应' },
      { key: 'CAREER_AWARENESS', label: '职业认知' },
      { key: 'INNOVATION', label: '创新思维' },
      { key: 'TIME_MANAGEMENT', label: '时间管理' },
      { key: 'EMOTIONAL', label: '情绪管理' },
      { key: 'LEADERSHIP', label: '领导力' }
    ]

    const dimensionHtml = dimensions.map(dim => {
      const score = dimensionScores[dim.key] || 0
      const percentage = Math.min(score, 100)
      return `
        <div style="margin-bottom: 12px; display: flex; align-items: center;">
          <span style="width: 100px; font-size: 14px; color: #333;">${dim.label}</span>
          <div style="flex: 1; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin: 0 10px;">
            <div style="width: ${percentage}%; height: 100%; background: #3b82f6; border-radius: 10px;"></div>
          </div>
          <span style="width: 50px; font-size: 14px; color: #666; text-align: right;">${score}分</span>
        </div>
      `
    }).join('')

    // 构建 HTML 内容
    container.innerHTML = `
      <div style="max-width: 720px; margin: 0 auto;">
        <h1 style="text-align: center; color: #3b82f6; font-size: 28px; margin-bottom: 10px; font-weight: bold;">
          学生职场潜能测评报告
        </h1>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; color: #666; font-size: 14px;">
          <span>姓名: ${userName}</span>
          <span>测评日期: ${new Date(detail.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>

        <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
            总体评分: ${totalScore}/100
          </div>
          <div style="font-size: 16px; color: #3b82f6;">
            评级: ${ratingText}
          </div>
        </div>

        <h2 style="font-size: 18px; color: #3b82f6; margin-bottom: 15px; font-weight: bold;">各维度得分</h2>
        <div style="margin-bottom: 30px;">
          ${dimensionHtml}
        </div>

        <div style="font-size: 11px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          免责声明：本报告仅根据本次测评的回答内容进行分析，不代表公司对候选人的最终评价。
        </div>
      </div>
    `

    document.body.appendChild(container)

    // 使用 html2canvas 渲染
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 800,
      height: container.scrollHeight
    })

    // 创建 PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight)

    const scaledWidth = imgWidth * ratio
    const scaledHeight = imgHeight * ratio

    let heightLeft = scaledHeight
    let position = 10

    pdf.addImage(imgData, 'PNG', 10, position, scaledWidth, scaledHeight)
    heightLeft -= (pdfHeight - 20)

    while (heightLeft > 0) {
      position = heightLeft - scaledHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, scaledWidth, scaledHeight)
      heightLeft -= (pdfHeight - 20)
    }

    pdf.save(`测评报告_${userName}_${new Date().toISOString().slice(0, 10)}.pdf`)

    document.body.removeChild(container)
  } catch (error) {
    console.error('导出 PDF 失败:', error)
    alert('导出 PDF 失败，请稍后重试')
  } finally {
    exportingId.value = null
  }
}

const exportData = async (format: 'pdf' | 'excel') => {
  try {
    const response = await adminApi.exportAllToExcel()
    
    // 创建 Blob 并触发下载
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `测评记录_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请稍后重试')
  }
}

const logout = () => {
  authStore.logout()
  router.push('/admin/login')
}

const confirmDelete = (assessment: AssessmentRecord) => {
  if (confirm(`确定要删除 ${assessment.userName} 的测评记录吗？此操作不可恢复。`)) {
    deleteAssessment(assessment.id)
  }
}

const deleteAssessment = async (id: string) => {
  try {
    const response = await adminApi.deleteAssessment(id)
    if (response.data.success) {
      alert('删除成功')
      loadAssessments() // 重新加载列表
    } else {
      alert(response.data.error || '删除失败')
    }
  } catch (error) {
    console.error('删除测评记录失败:', error)
    alert('删除失败，请稍后重试')
  }
}

onMounted(() => {
  loadAssessments()
})
</script>
