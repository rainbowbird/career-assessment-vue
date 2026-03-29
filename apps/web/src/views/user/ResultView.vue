<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-md sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-chart-line text-primary text-2xl"></i>
          <span class="text-lg font-bold">学生职场潜能测评</span>
        </div>
      </div>
    </nav>

    <main v-if="result" class="container mx-auto px-4 py-8 max-w-6xl">
      <section class="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8 slide-in">
        <!-- 总分展示 -->
        <div class="text-center mb-10">
          <h2 class="text-2xl font-bold mb-6">测评结果概览</h2>
          <div class="inline-flex items-center justify-center">
            <div class="w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center relative">
              <span class="text-4xl font-bold">{{ result.totalScore }}</span>
              <span class="text-neutral">/100</span>
            </div>
            <div 
              class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow text-sm font-medium"
              :class="ratingClass"
            >
              {{ ratingLabel }}
            </div>
          </div>
          <div class="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg max-w-md mx-auto">
            <p class="text-sm text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              您的详细测评报告和发展建议将由 HR 通过您填写的邮箱地址发送
            </p>
          </div>
        </div>

        <!-- 雷达图 -->
        <div class="mb-10">
          <h3 class="text-lg font-semibold mb-4 text-center">各项能力分布</h3>
          <div class="h-80 max-w-md mx-auto">
            <RadarChart 
              v-if="chartData"
              :data="chartData"
              :options="chartOptions"
            />
          </div>
        </div>

        <!-- 优势与不足 -->
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <!-- 优势 -->
          <div class="bg-green-50 rounded-xl p-5 border border-green-100">
            <h3 class="font-semibold text-green-700 mb-3 flex items-center">
              <i class="fa-solid fa-circle-plus mr-2"></i> 主要优势
            </h3>
            <ul class="space-y-2 text-sm">
              <li v-for="strength in strengths" :key="strength" class="flex items-start">
                <i class="fa-solid fa-check text-green-500 mt-1 mr-2"></i>
                <span>{{ getDimensionLabel(strength) }}</span>
              </li>
            </ul>
          </div>
          
          <!-- 不足 -->
          <div class="bg-amber-50 rounded-xl p-5 border border-amber-100">
            <h3 class="font-semibold text-amber-700 mb-3 flex items-center">
              <i class="fa-solid fa-circle-exclamation mr-2"></i> 待提升领域
            </h3>
            <ul class="space-y-2 text-sm">
              <li v-for="weakness in weaknesses" :key="weakness" class="flex items-start">
                <i class="fa-solid fa-arrow-up text-amber-500 mt-1 mr-2"></i>
                <span>{{ getDimensionLabel(weakness) }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 发展建议 -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold mb-4">学习与发展资源</h3>
          <div class="bg-light p-5 rounded-lg">
            <div class="bg-white p-3 rounded-lg shadow-sm">
              <h4 class="font-medium text-primary mb-2">推荐阅读</h4>
              <ul class="text-sm space-y-2 text-neutral">
                <li class="flex items-start">
                  <i class="fa-solid fa-book text-primary mt-1 mr-2"></i>
                  <span>《高效能人士的七个习惯》- 史蒂芬·柯维</span>
                </li>
                <li class="flex items-start">
                  <i class="fa-solid fa-book text-primary mt-1 mr-2"></i>
                  <span>《沟通的方法》- 脱不花</span>
                </li>
                <li class="flex items-start">
                  <i class="fa-solid fa-book text-primary mt-1 mr-2"></i>
                  <span>《原则》- 雷·达里奥</span>
                </li>
                <li class="flex items-start">
                  <i class="fa-solid fa-book text-primary mt-1 mr-2"></i>
                  <span>《思考，快与慢》- 丹尼尔·卡尼曼</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button
            @click="downloadReport"
            class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow"
          >
            <i class="fa-solid fa-download mr-2"></i> 下载我的报告
          </button>
          
          <button
            @click="restartAssessment"
            class="px-6 py-3 border border-gray-300 rounded-lg text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            <i class="fa-solid fa-rotate-right mr-2"></i> 重新测评
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAssessmentStore } from '@/stores/assessment'
import { assessmentApi } from '@/api/assessment'
import { DimensionLabels } from '@career-assessment/shared'
import type { Dimension, AssessmentResult } from '@career-assessment/shared'
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

// 注册 Chart.js 组件
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

const router = useRouter()
const assessmentStore = useAssessmentStore()

const result = computed(() => assessmentStore.result)

// 评级计算
const ratingLabel = computed(() => {
  const score = result.value?.totalScore || 0
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  return '待提升'
})

const ratingClass = computed(() => {
  const score = result.value?.totalScore || 0
  if (score >= 90) return 'bg-green-100 text-green-800'
  if (score >= 80) return 'bg-blue-100 text-blue-800'
  if (score >= 70) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
})

// 优势和不足
const strengths = computed(() => result.value?.strengths?.slice(0, 3) || [])
const weaknesses = computed(() => result.value?.weaknesses?.slice(-3).reverse() || [])

const getDimensionLabel = (dimension: Dimension | string) => {
  return DimensionLabels[dimension as Dimension] || dimension
}

// 图表数据
const chartData = computed(() => {
  if (!result.value?.dimensionScores) return null
  
  return {
    labels: result.value.dimensionScores.map(d => getDimensionLabel(d.dimension)),
    datasets: [{
      label: '得分',
      data: result.value.dimensionScores.map(d => d.score),
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20
      }
    }
  },
  plugins: {
    legend: {
      display: false
    }
  }
}

// 方法
const downloadReport = async () => {
  // TODO: 实现 PDF 下载功能
  alert('PDF 下载功能即将上线')
}

const restartAssessment = () => {
  if (confirm('确定要重新开始测评吗？')) {
    assessmentStore.reset()
    router.push('/')
  }
}

// 加载结果
onMounted(async () => {
  if (!assessmentStore.assessmentId) {
    router.push('/')
    return
  }
  
  // 如果 store 中没有结果，从 API 获取
  if (!assessmentStore.result) {
    try {
      const response = await assessmentApi.getResult(assessmentStore.assessmentId)
      if (response.data.success && response.data.data) {
        assessmentStore.calculateResult(response.data.data as AssessmentResult)
      }
    } catch (error) {
      console.error('获取结果失败:', error)
      alert('获取结果失败，请稍后重试')
    }
  }
})
</script>
