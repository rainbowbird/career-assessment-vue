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

    <main v-if="assessment" class="container mx-auto px-4 py-8 max-w-4xl bg-white">
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
  if (!assessment.value || isGeneratingPDF.value) return

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

    // 创建临时容器生成PDF内容
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

    // 获取用户详细信息
    const user = assessment.value.user
    const totalScore = assessment.value.totalScore || 0
    const dimensionScores = assessment.value.dimensionScores || {}

    // 获取评级
    let ratingText = ''
    if (totalScore >= 90) ratingText = '优秀'
    else if (totalScore >= 80) ratingText = '良好'
    else if (totalScore >= 70) ratingText = '中等'
    else ratingText = '待提升'

    // 构建维度得分 HTML
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

    // 根据分数获取颜色
    const getScoreColor = (score: number) => {
      if (score >= 85) return { bg: '#10b981', light: '#d1fae5', border: '#059669' } // 绿色 - 优秀
      if (score >= 70) return { bg: '#3b82f6', light: '#dbeafe', border: '#2563eb' } // 蓝色 - 良好
      if (score >= 60) return { bg: '#f59e0b', light: '#fef3c7', border: '#d97706' } // 橙色 - 中等
      return { bg: '#ef4444', light: '#fee2e2', border: '#dc2626' } // 红色 - 待提升
    }

    const dimensionHtml = dimensions.map(dim => {
      const score = dimensionScores[dim.key] || 0
      const percentage = Math.min(score, 100)
      const colors = getScoreColor(score)
      
      return `
        <div style="margin-bottom: 16px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 15px; font-weight: 600; color: #1e293b;">${dim.label}</span>
            <span style="background: ${colors.light}; color: ${colors.border}; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; border: 1px solid ${colors.border};">
              ${score}分
            </span>
          </div>
          <div style="position: relative; height: 28px; background: #f1f5f9; border-radius: 14px; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${percentage}%; 
                        background: linear-gradient(90deg, ${colors.bg} 0%, ${colors.bg}dd 100%); 
                        border-radius: 14px; box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);">
              <div style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); 
                          color: white; font-size: 12px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                ${percentage}%
              </div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #64748b;">
            <span>0分</span>
            <span style="color: ${colors.border}; font-weight: 500;">
              ${score >= 85 ? '★ 优秀' : score >= 70 ? '● 良好' : score >= 60 ? '○ 中等' : '△ 待提升'}
            </span>
            <span>100分</span>
          </div>
        </div>
      `
    }).join('')

    // 构建 HTML 内容
    container.innerHTML = `
      <div style="max-width: 720px; margin: 0 auto;">
        <h1 style="text-align: center; color: #3b82f6; font-size: 28px; margin-bottom: 10px; font-weight: bold;">
          学生职场潜能测评报告
        </h1>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="font-size: 16px; color: #64748b; margin-bottom: 15px; font-weight: bold;">基本信息</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; color: #333;">
            <div><strong>姓名：</strong>${user.name}</div>
            <div><strong>专业：</strong>${user.major}</div>
            <div><strong>班级：</strong>${user.class}</div>
            <div><strong>学校：</strong>${user.school}</div>
            <div><strong>学历：</strong>${getEducationLabel(user.education)}</div>
            <div><strong>电话：</strong>${user.phone}</div>
            <div><strong>邮箱：</strong>${user.email}</div>
            <div><strong>测评日期：</strong>${new Date(assessment.value.createdAt).toLocaleDateString('zh-CN')}</div>
          </div>
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
    pdf.save(`测评报告_${user.name}_${new Date().toISOString().slice(0, 10)}.pdf`)

    // 移除临时元素
    document.body.removeChild(loadingDiv)
    document.body.removeChild(container)

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
