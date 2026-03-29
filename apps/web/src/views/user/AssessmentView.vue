<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-md sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-chart-line text-primary text-2xl"></i>
          <span class="text-lg font-bold">学生职场潜能测评</span>
        </div>
      </div>
    </nav>

    <main class="container mx-auto px-4 py-8 max-w-6xl">
      <section class="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8 slide-in">
        <!-- 进度条 -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <span class="font-medium">{{ progress.current }}</span>
              <span class="mx-1 text-neutral">/</span>
              <span class="text-neutral">{{ progress.total }}</span>
              <span class="ml-2 text-sm text-neutral">题</span>
            </div>
            <div class="text-sm text-neutral">
              <i class="fa-regular fa-clock mr-1"></i>
              <span>用时: {{ formattedTime }}</span>
            </div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-primary h-2 rounded-full transition-all duration-500"
              :style="{ width: progress.percentage + '%' }"
            ></div>
          </div>
          <div class="text-right text-sm text-neutral mt-1">
            {{ progress.percentage }}%
          </div>
        </div>

        <!-- 题目卡片 -->
        <div v-if="currentQuestion" class="bg-light rounded-xl p-6 mb-6">
          <h3 class="text-xl font-semibold mb-4 text-gray-800">
            {{ currentQuestion.scenario }}
          </h3>
          <p class="text-lg mb-6 text-gray-700">
            {{ currentQuestion.content }}
          </p>
          <div class="space-y-3">
            <label
              v-for="option in currentQuestion.options"
              :key="option.id"
              class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary/50"
              :class="selectedOptionId === option.id ? 'border-primary bg-primary/5' : 'border-gray-200'"
            >
              <input
                type="radio"
                :name="'question-' + currentQuestion.id"
                :value="option.id"
                v-model="selectedOptionId"
                class="mt-1 mr-3"
                @change="selectOption(option.id)"
              />
              <span class="flex-1">{{ option.content }}</span>
            </label>
          </div>
        </div>

        <!-- 底部导航 -->
        <div class="flex justify-between items-center">
          <button
            @click="prevQuestion"
            :disabled="!canGoPrev"
            class="px-6 py-2 border border-gray-300 rounded-lg text-neutral hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="fa-solid fa-arrow-left mr-2"></i> 上一题
          </button>
          
          <button
            @click="togglePause"
            class="px-4 py-2 border border-gray-300 rounded-lg text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            <i class="fa-solid fa-pause mr-1"></i> 暂停
          </button>
          
          <button
            v-if="!isLastQuestion"
            @click="nextQuestion"
            :disabled="!selectedOptionId"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一题 <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
          
          <button
            v-else
            @click="submitAssessment"
            :disabled="!selectedOptionId || isSubmitting"
            class="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? '提交中...' : '完成测评' }} <i class="fa-solid fa-check ml-2"></i>
          </button>
        </div>
      </section>
    </main>

    <!-- 暂停模态框 -->
    <div v-if="isPaused" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
        <i class="fa-solid fa-circle-pause text-primary text-4xl mb-4"></i>
        <h2 class="text-xl font-bold mb-2">测评已暂停</h2>
        <p class="text-neutral mb-4">
          已完成: {{ progress.current }}/{{ progress.total }}题 | 用时: {{ formattedTime }}
        </p>
        <div class="flex justify-center space-x-3">
          <button
            @click="togglePause"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200"
          >
            继续测评
          </button>
          <button
            @click="confirmRestart"
            class="px-6 py-2 border border-gray-300 rounded-lg text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            重新开始
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAssessmentStore } from '@/stores/assessment'
import { assessmentApi } from '@/api/assessment'
import { questionApi } from '@/api/question'
import type { Question } from '@career-assessment/shared'

const router = useRouter()
const assessmentStore = useAssessmentStore()

// 状态
const questions = ref<Question[]>([])
const selectedOptionId = ref<string>('')
const isSubmitting = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null

// 计算属性
const currentQuestion = computed(() => {
  return questions.value[assessmentStore.currentQuestionIndex] || null
})

const progress = computed(() => ({
  current: assessmentStore.currentQuestionIndex + 1,
  total: questions.value.length,
  percentage: questions.value.length 
    ? Math.round(((assessmentStore.currentQuestionIndex + 1) / questions.value.length) * 100)
    : 0
}))

const canGoPrev = computed(() => assessmentStore.currentQuestionIndex > 0)
const isLastQuestion = computed(() => 
  assessmentStore.currentQuestionIndex === questions.value.length - 1
)

const formattedTime = computed(() => assessmentStore.formattedTime)
const isPaused = computed(() => assessmentStore.isPaused)

// 方法
const loadQuestions = async () => {
  try {
    const response = await questionApi.getQuestions()
    if (response.data.success && response.data.data) {
      questions.value = response.data.data
      assessmentStore.setQuestions(questions.value)
      
      // 恢复已选择的答案
      const existingAnswer = assessmentStore.answers.find(
        a => a.questionId === currentQuestion.value?.id
      )
      if (existingAnswer) {
        selectedOptionId.value = existingAnswer.optionId
      }
    }
  } catch (error) {
    console.error('加载题目失败:', error)
    alert('加载题目失败，请刷新页面重试')
  }
}

const selectOption = (optionId: string) => {
  selectedOptionId.value = optionId
  if (currentQuestion.value && assessmentStore.assessmentId) {
    assessmentStore.answerCurrentQuestion(optionId)
    // 提交答案到服务器
    assessmentApi.submitAnswer(
      assessmentStore.assessmentId,
      currentQuestion.value.id,
      optionId
    ).catch(error => {
      console.error('提交答案失败:', error)
    })
  }
}

const nextQuestion = () => {
  if (!selectedOptionId.value) {
    alert('请选择一个选项')
    return
  }
  
  assessmentStore.nextQuestion()
  
  // 恢复下一题的答案
  const nextQ = questions.value[assessmentStore.currentQuestionIndex]
  if (nextQ) {
    const existingAnswer = assessmentStore.answers.find(a => a.questionId === nextQ.id)
    selectedOptionId.value = existingAnswer?.optionId || ''
  }
}

const prevQuestion = () => {
  assessmentStore.prevQuestion()
  
  // 恢复上一题的答案
  const prevQ = questions.value[assessmentStore.currentQuestionIndex]
  if (prevQ) {
    const existingAnswer = assessmentStore.answers.find(a => a.questionId === prevQ.id)
    selectedOptionId.value = existingAnswer?.optionId || ''
  }
}

const togglePause = () => {
  assessmentStore.togglePause()
}

const confirmRestart = () => {
  if (confirm('确定要重新开始吗？当前进度将丢失。')) {
    assessmentStore.reset()
    router.push('/')
  }
}

const submitAssessment = async () => {
  if (!selectedOptionId.value) {
    alert('请选择一个选项')
    return
  }
  
  isSubmitting.value = true
  
  try {
    // 提交最后一题的答案
    if (currentQuestion.value && assessmentStore.assessmentId) {
      await assessmentApi.submitAnswer(
        assessmentStore.assessmentId,
        currentQuestion.value.id,
        selectedOptionId.value
      )
    }
    
    // 完成测评
    if (assessmentStore.assessmentId) {
      const response = await assessmentApi.completeAssessment(assessmentStore.assessmentId)
      if (response.data.success) {
        // 保存结果到 store
        if (response.data.data) {
          assessmentStore.calculateResult(response.data.data)
        }
        router.push('/result')
      }
    }
  } catch (error) {
    console.error('提交测评失败:', error)
    alert('提交失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

// 生命周期
onMounted(() => {
  // 检查是否有进行中的测评
  if (!assessmentStore.assessmentId) {
    router.push('/')
    return
  }
  
  loadQuestions()
  
  // 启动计时器
  timerInterval = setInterval(() => {
    assessmentStore.incrementTime()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>
