import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 用户端路由
const userRoutes = [
  {
    path: '/',
    name: 'Welcome',
    component: () => import('@/views/user/WelcomeView.vue')
  },
  {
    path: '/intro',
    name: 'Intro',
    component: () => import('@/views/user/IntroView.vue')
  },
  {
    path: '/user-info',
    name: 'UserInfo',
    component: () => import('@/views/user/UserInfoView.vue')
  },
  {
    path: '/assessment',
    name: 'Assessment',
    component: () => import('@/views/user/AssessmentView.vue')
  },
  {
    path: '/result',
    name: 'Result',
    component: () => import('@/views/user/ResultView.vue')
  }
]

// 管理员路由
const adminRoutes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/LoginView.vue')
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/assessments',
    name: 'AdminAssessments',
    component: () => import('@/views/admin/AssessmentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/assessments/:id',
    name: 'AdminAssessmentDetail',
    component: () => import('@/views/admin/AssessmentDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: () => import('@/views/admin/SettingsView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: [...userRoutes, ...adminRoutes]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/admin/login')
  } else if (to.path === '/admin/login' && authStore.isAuthenticated) {
    next('/admin')
  } else {
    next()
  }
})

export default router
