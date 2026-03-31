<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-md sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-chart-line text-primary text-2xl"></i>
          <span class="text-lg font-bold">测评详情</span>
        </div>
        <div class="flex items-center space-x-4">
          <router-link
            to="/admin/assessments"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            <i class="fa-solid fa-arrow-left mr-1"></i> 返回列表
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

    <main v-if="assessment" ref="reportContainer" class="container mx-auto px-4 py-8 max-w-4xl bg-white">
      <!-- 头部信息 -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 class="text-2xl font-bold">{{ assessment.user.name }}</h2>
            <p class="text-neutral">
              {{ assessment.user.major }} | {{ assessment.user.class }} | {{ getEducationLabel(assessment.user.education) }}
            </p>
          </div>
          <div class="mt-4 md:mt-0 text-right">
            <p class="text-neutral text-sm">测评日期</p>
            <p class="font-medium">{{ formatDate(assessment.createdAt) }}</p>
          </div>
        </div>

        <!-- 总分 -->
        <div class="flex items-center justify-between bg-light p-5 rounded-xl">
          <div class="text-center">
            <h4 class="text-neutral text-sm mb-1">总体评分</h4>
            <div class="flex items-center justify-center">
              <span class="text-4xl font-bold">{{ assessment.totalScore || 0 }}</span>
              <span class="text-neutral">/100</span>
            </div>
          </div>
          <div class="flex-1 ml-6">
            <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                class="h-3 rounded-full bg-primary"
                :style="{ width: (assessment.totalScore || 0) + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-neutral">
              <span>待提升</span>
              <span>中等</span>
              <span>良好</span>
              <span>优秀</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 维度得分 -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">各维度得分</h3>
        
        <div class="space-y-4">
          <div
            v-for="(score, dimension) in dimensionScores"
            :key="dimension"
            class="border rounded-xl overflow-hidden"
          >
            <div class="bg-light p-4 border-b flex justify-between items-center">
              <h4 class="font-semibold">{{ getDimensionLabel(dimension) }}</h4>
              <span class="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
                {{ score }}/100
              </span>
            </div>
            <div class="p-4">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  class="h-2 rounded-full transition-all duration-1000"
                  :class="getScoreColorClass(score)"
                  :style="{ width: score + '%' }"
                ></div>
              </div>
              <p class="text-sm text-neutral">{{ getDimensionAnalysis(dimension as string, score) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="bg-white rounded-xl shadow-md p-6 flex flex-wrap justify-center gap-4">
        <button
          @click="updateStatus('REVIEWED')"
          :disabled="assessment.reviewStatus === 'REVIEWED'"
          class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50"
        >
          <i class="fa-solid fa-check mr-2"></i>标记为已审阅
        </button>
        
        <button
          @click="openEmailModal"
          class="px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-all duration-200"
        >
          <i class="fa-solid fa-envelope mr-2"></i>发送邮件
        </button>
        
        <button
          @click="exportPDF"
          :disabled="isGeneratingPDF"
          class="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50"
        >
          <i v-if="!isGeneratingPDF" class="fa-solid fa-file-export mr-2"></i>
          <i v-else class="fa-solid fa-spinner fa-spin mr-2"></i>
          {{ isGeneratingPDF ? '生成中...' : '导出报告' }}
        </button>
      </div>
    </main>

    <!-- 邮件发送弹窗 -->
    <EmailModal
      :show="showEmailModal"
      :assessment-id="assessment?.id || ''"
      :default-to="assessment?.user?.email"
      :smtp-configured="smtpConfigured"
      @close="showEmailModal = false"
      @sent="loadAssessment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/api/admin'
import { DimensionLabels, EducationLabels } from '@career-assessment/shared'
import type { Dimension } from '@career-assessment/shared'
import EmailModal from '@/components/admin/EmailModal.vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const assessment = ref<any>(null)
const isLoading = ref(false)
const showEmailModal = ref(false)
const smtpConfigured = ref(false)
const reportContainer = ref<HTMLElement | null>(null)
const isGeneratingPDF = ref(false)

// 计算属性
const dimensionScores = computed(() => {
  if (!assessment.value?.dimensionScores) return {}
  return assessment.value.dimensionScores
})

// 方法
const loadAssessment = async () => {
  const id = route.params.id as string
  if (!id) {
    router.push('/admin/assessments')
    return
  }
  
  try {
    isLoading.value = true
    const response = await adminApi.getAssessmentDetail(id)
    if (response.data.success && response.data.data) {
      assessment.value = response.data.data
    }
  } catch (error) {
    console.error('加载测评详情失败:', error)
    alert('加载失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const updateStatus = async (status: string) => {
  if (!assessment.value) return
  
  try {
    const response = await adminApi.updateReviewStatus(assessment.value.id, status)
    if (response.data.success) {
      assessment.value.reviewStatus = status
      alert('状态更新成功')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    alert('更新失败，请稍后重试')
  }
}

const openEmailModal = () => {
  showEmailModal.value = true
}

const checkSmtpConfig = async () => {
  try {
    const response = await adminApi.checkSmtpConfig()
    if (response.data.success && response.data.data) {
      smtpConfigured.value = response.data.data.configured
    }
  } catch (error) {
    console.error('检查 SMTP 配置失败:', error)
  }
}

// 导出报告为 PDF
const exportPDF = async () => {
  if (!assessment.value || !reportContainer.value || isGeneratingPDF.value) return

  isGeneratingPDF.value = true

  try {
    const userName = assessment.value.user.name

    // 显示加载状态
    const loadingDiv = document.createElement('div')
    loadingDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `
    loadingDiv.innerHTML = '<div style="background: white; padding: 20px; border-radius: 8px; font-weight: bold;">正在生成 PDF...</div>'
    document.body.appendChild(loadingDiv)

    // 使用 html2canvas 捕获页面
    const canvas = await html2canvas(reportContainer.value, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
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

    // 如果内容超出一页，需要分页
    let heightLeft = scaledHeight
    let position = 10

    // 添加第一页
    pdf.addImage(imgData, 'PNG', 10, position, scaledWidth, scaledHeight)
    heightLeft -= (pdfHeight - 20)

    // 如果内容超过一页，添加更多页
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, scaledWidth, scaledHeight)
      heightLeft -= (pdfHeight - 20)
    }

    // 保存 PDF
    pdf.save(`测评报告_${userName}_${new Date().toISOString().slice(0, 10)}.pdf`)

    // 移除加载提示
    document.body.removeChild(loadingDiv)

    console.log('PDF 报告已生成并下载')
  } catch (error) {
    console.error('生成 PDF 失败:', error)
    alert('生成 PDF 失败，请稍后重试')
  } finally {
    isGeneratingPDF.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const getEducationLabel = (education: string) => {
  return EducationLabels[education as keyof typeof EducationLabels] || education
}

const getDimensionLabel = (dimension: string) => {
  return DimensionLabels[dimension as Dimension] || dimension
}

const getScoreColorClass = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getDimensionAnalysis = (dimension: string, score: number) => {
  // 根据分数返回不同的分析文本
  if (score >= 80) {
    return `该生在${getDimensionLabel(dimension)}方面表现优秀，具备良好的发展潜力。`
  } else if (score >= 60) {
    return `该生在${getDimensionLabel(dimension)}方面表现良好，还有一定的提升空间。`
  } else {
    return `该生在${getDimensionLabel(dimension)}方面有待加强，建议重点关注。`
  }
}

const logout = () => {
  authStore.logout()
  router.push('/admin/login')
}

onMounted(() => {
  loadAssessment()
  checkSmtpConfig()
})
</script>
