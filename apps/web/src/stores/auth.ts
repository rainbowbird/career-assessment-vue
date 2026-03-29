import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false)
  const token = ref<string | null>(localStorage.getItem('admin_token'))

  // Getters
  const isLoggedIn = computed(() => isAuthenticated.value || !!token.value)

  // Actions
  function setAuth(authToken: string) {
    token.value = authToken
    isAuthenticated.value = true
    localStorage.setItem('admin_token', authToken)
  }

  function logout() {
    token.value = null
    isAuthenticated.value = false
    localStorage.removeItem('admin_token')
  }

  function checkAuth() {
    const storedToken = localStorage.getItem('admin_token')
    if (storedToken) {
      token.value = storedToken
      isAuthenticated.value = true
    }
  }

  return {
    isAuthenticated,
    token,
    isLoggedIn,
    setAuth,
    logout,
    checkAuth
  }
})
