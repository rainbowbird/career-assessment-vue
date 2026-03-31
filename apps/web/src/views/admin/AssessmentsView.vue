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
import { ReviewStatusLabels } from '@career-assessment/shared'
import type { AssessmentRecord } from '@career-assessment/shared'

const router = useRouter()
const authStore = useAuthStore()

// 状态
const assessments = ref<AssessmentRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterStatus = ref('')
const isLoading = ref(false)

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
