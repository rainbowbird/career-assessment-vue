<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <nav class="bg-white shadow-md sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-chart-line text-primary text-2xl"></i>
          <span class="text-lg font-bold">管理员仪表板</span>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-neutral">
            登录状态: <span class="text-green-500">已登录</span>
          </span>
          <button
            @click="logout"
            class="px-4 py-1 border border-gray-300 rounded-lg text-sm text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            <i class="fa-solid fa-sign-out-alt mr-1"></i> 退出
          </button>
        </div>
      </div>
    </nav>

    <main class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-neutral text-sm">总测评人数</p>
              <h3 class="text-3xl font-bold mt-1">{{ stats?.totalAssessments || 0 }}</h3>
            </div>
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <i class="fa-solid fa-users text-primary"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-neutral text-sm">平均总分</p>
              <h3 class="text-3xl font-bold mt-1">{{ stats?.averageTotalScore || 0 }}</h3>
            </div>
            <div class="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <i class="fa-solid fa-chart-line text-secondary"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-neutral text-sm">平均完成时间</p>
              <h3 class="text-3xl font-bold mt-1">{{ formatTime(stats?.averageCompletionTime || 0) }}</h3>
            </div>
            <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <i class="fa-solid fa-clock text-accent"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- 维度平均分 -->
        <div class="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 class="font-semibold mb-4">各维度平均得分</h3>
          <div class="h-64">
            <BarChart v-if="dimensionChartData" :data="dimensionChartData" :options="barChartOptions" />
          </div>
        </div>

        <!-- 成绩分布 -->
        <div class="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 class="font-semibold mb-4">测评成绩分布</h3>
          <div class="h-64">
            <DoughnutChart v-if="distributionChartData" :data="distributionChartData" :options="doughnutOptions" />
          </div>
        </div>
      </div>

      <!-- 专业分布 -->
      <div class="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-8">
        <h3 class="font-semibold mb-4">专业分布</h3>
        <div class="h-64">
          <BarChart v-if="majorChartData" :data="majorChartData" :options="horizontalBarOptions" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <router-link
          to="/admin/assessments"
          class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 text-center"
        >
          <i class="fa-solid fa-list mr-2"></i>查看测评记录
        </router-link>
        
        <router-link
          to="/admin/settings"
          class="px-6 py-3 border border-gray-300 rounded-lg text-neutral hover:bg-gray-100 transition-all duration-200 text-center"
        >
          <i class="fa-solid fa-cog mr-2"></i>系统配置
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/api/admin'
import { DimensionLabels } from '@career-assessment/shared'
import type { DashboardStats } from '@career-assessment/shared'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const BarChart = Bar
const DoughnutChart = Doughnut

const router = useRouter()
const authStore = useAuthStore()

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(true)

// 图表数据
const dimensionChartData = computed(() => {
  if (!stats.value?.dimensionAverages) return null
  
  const dimensions = Object.entries(stats.value.dimensionAverages)
  return {
    labels: dimensions.map(([dim]) => DimensionLabels[dim as keyof typeof DimensionLabels] || dim),
    datasets: [{
      label: '平均分',
      data: dimensions.map(([, score]) => score),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  }
})

const distributionChartData = computed(() => {
  if (!stats.value?.scoreDistribution) return null
  
  return {
    labels: stats.value.scoreDistribution.map(d => d.range),
    datasets: [{
      data: stats.value.scoreDistribution.map(d => d.count),
      backgroundColor: [
        'rgba(239, 68, 68, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(59, 130, 246, 0.6)',
        'rgba(16, 185, 129, 0.6)',
        'rgba(99, 102, 241, 0.6)'
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(99, 102, 241, 1)'
      ],
      borderWidth: 1
    }]
  }
})

const majorChartData = computed(() => {
  if (!stats.value?.majorDistribution) return null
  
  return {
    labels: stats.value.majorDistribution.map(d => d.major),
    datasets: [{
      label: '人数',
      data: stats.value.majorDistribution.map(d => d.count),
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1
    }]
  }
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 100
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  scales: {
    x: {
      beginAtZero: true
    }
  }
}

// 方法
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const logout = () => {
  authStore.logout()
  router.push('/admin/login')
}

const loadStats = async () => {
  try {
    isLoading.value = true
    const response = await adminApi.getStats()
    if (response.data.success && response.data.data) {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>
