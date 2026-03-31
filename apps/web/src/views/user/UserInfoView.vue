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

    <main class="container mx-auto px-4 py-8 max-w-6xl">
      <section class="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8 slide-in">
        <div class="flex items-center space-x-1 mb-6">
          <button 
            @click="goBack"
            class="flex items-center space-x-1 text-sm px-4 py-2 border border-gray-300 rounded-lg text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            <i class="fa-solid fa-arrow-left"></i>
            <span>返回</span>
          </button>
        </div>

        <h2 class="text-2xl font-bold mb-6 text-center">填写个人信息</h2>

        <form @submit.prevent="submitForm" class="max-w-md mx-auto">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.name"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              专业 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.major"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              班级 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.class"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              邮箱 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
            <p class="text-xs text-neutral mt-1">请填写准确的邮箱地址，HR会发送个人测评报告和发展建议</p>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              学校 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.school"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              手机号 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.phone"
              type="tel"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              学历 <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="form.education"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            >
              <option value="">请选择</option>
              <option value="BACHELOR">本科</option>
              <option value="MASTER">硕士</option>
              <option value="DOCTOR">博士</option>
              <option value="COLLEGE">专科</option>
            </select>
          </div>
          
          <div class="text-center">
            <button 
              type="submit"
              class="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow active:scale-95"
            >
              开始测评
            </button>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAssessmentStore } from '@/stores/assessment'
import { assessmentApi } from '@/api/assessment'
import type { UserInfo } from '@career-assessment/shared'

const router = useRouter()
const assessmentStore = useAssessmentStore()

const form = reactive<UserInfo>({
  name: '',
  major: '',
  class: '',
  email: '',
  school: '',
  phone: '',
  education: 'BACHELOR'
})

const submitForm = async () => {
  try {
    assessmentStore.setUserInfo(form)
    const response = await assessmentApi.createAssessment(form)

    if (response.data.success) {
      const data = response.data.data

      if (data.isExisting) {
        // 有未完成的测评，询问是否继续
        if (confirm('您有未完成的测评记录，是否继续？')) {
          assessmentStore.startAssessment(data.id)
          router.push('/assessment')
        }
      } else {
        // 新创建的测评
        assessmentStore.startAssessment(data.id)
        router.push('/assessment')
      }
    }
  } catch (error: any) {
    console.error('创建测评失败:', error)

    // 处理已完成测评的情况
    if (error.response?.data?.code === 'ALREADY_COMPLETED') {
      alert('您已完成测评，每人仅限一次测评机会。')
      // 可以在这里添加跳转到结果查看页面的逻辑
      return
    }

    alert(error.response?.data?.error || '创建测评失败，请稍后重试')
  }
}

const goBack = () => {
  router.back()
}
</script>
