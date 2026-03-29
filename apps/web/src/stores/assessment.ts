import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { UserInfo, Question, Answer, AssessmentResult, DimensionScore } from '@career-assessment/shared'
import { DimensionLabels } from '@career-assessment/shared'

export const useAssessmentStore = defineStore('assessment', () => {
  // State
  const userInfo = ref<UserInfo | null>(null)
  const questions = ref<Question[]>([])
  const answers = ref<Answer[]>([])
  const currentQuestionIndex = ref(0)
  const startTime = ref<Date | null>(null)
  const elapsedTime = ref(0)
  const assessmentId = ref<string | null>(null)
  const result = ref<AssessmentResult | null>(null)
  const isPaused = ref(false)

  // Getters
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
  const progress = computed(() => ({
    current: currentQuestionIndex.value + 1,
    total: questions.value.length,
    percentage: Math.round(((currentQuestionIndex.value + 1) / questions.value.length) * 100)
  }))
  const canGoNext = computed(() => {
    const currentQuestionId = questions.value[currentQuestionIndex.value]?.id
    return answers.value.some(a => a.questionId === currentQuestionId)
  })
  const canGoPrev = computed(() => currentQuestionIndex.value > 0)
  const isLastQuestion = computed(() => currentQuestionIndex.value === questions.value.length - 1)
  const formattedTime = computed(() => {
    const minutes = Math.floor(elapsedTime.value / 60)
    const seconds = elapsedTime.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  // Actions
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function setQuestions(qs: Question[]) {
    questions.value = qs
  }

  function startAssessment(id: string) {
    assessmentId.value = id
    startTime.value = new Date()
    currentQuestionIndex.value = 0
    answers.value = []
    elapsedTime.value = 0
  }

  function answerCurrentQuestion(optionId: string) {
    const questionId = questions.value[currentQuestionIndex.value].id
    const existingIndex = answers.value.findIndex(a => a.questionId === questionId)
    
    if (existingIndex >= 0) {
      answers.value[existingIndex].optionId = optionId
    } else {
      answers.value.push({ questionId, optionId })
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex.value < questions.value.length - 1) {
      currentQuestionIndex.value++
    }
  }

  function prevQuestion() {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--
    }
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function incrementTime() {
    if (!isPaused.value) {
      elapsedTime.value++
    }
  }

  function calculateResult(assessmentResult: AssessmentResult) {
    result.value = assessmentResult
  }

  function getDimensionScores(): DimensionScore[] {
    if (!result.value) return []
    return result.value.dimensionScores
  }

  function reset() {
    userInfo.value = null
    questions.value = []
    answers.value = []
    currentQuestionIndex.value = 0
    startTime.value = null
    elapsedTime.value = 0
    assessmentId.value = null
    result.value = null
    isPaused.value = false
  }

  return {
    userInfo,
    questions,
    answers,
    currentQuestionIndex,
    startTime,
    elapsedTime,
    assessmentId,
    result,
    isPaused,
    currentQuestion,
    progress,
    canGoNext,
    canGoPrev,
    isLastQuestion,
    formattedTime,
    setUserInfo,
    setQuestions,
    startAssessment,
    answerCurrentQuestion,
    nextQuestion,
    prevQuestion,
    togglePause,
    incrementTime,
    calculateResult,
    getDimensionScores,
    reset
  }
})
