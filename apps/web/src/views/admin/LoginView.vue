<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
      <div class="text-center mb-6">
        <i class="fa-solid fa-user-shield text-primary text-4xl mb-3"></i>
        <h1 class="text-2xl font-bold">管理员登录</h1>
        <p class="text-neutral text-sm">请输入管理员密码</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <div class="relative">
            <input 
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all pr-10"
              placeholder="请输入密码"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral hover:text-gray-700"
            >
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {{ error }}
        </div>

        <div class="flex space-x-3">
          <button 
            type="button"
            @click="goBack"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            返回
          </button>
          <button 
            type="submit"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/api/admin'

const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const showPassword = ref(false)
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!password.value) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    const response = await adminApi.login(password.value)
    if (response.data.success && response.data.data) {
      authStore.setAuth(response.data.data.token)
      router.push('/admin')
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || '登录失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>
