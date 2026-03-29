<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-md sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-cog text-primary text-2xl"></i>
          <span class="text-lg font-bold">系统配置</span>
        </div>
        <div class="flex items-center space-x-4">
          <router-link
            to="/admin"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-neutral hover:bg-gray-100 transition-all duration-200"
          >
            <i class="fa-solid fa-tachometer-alt mr-1"></i> 仪表板
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

    <main class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- 标签页 -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <div class="flex border-b">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-1 py-4 text-center font-medium transition-colors duration-200"
            :class="activeTab === tab.id ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-neutral hover:text-gray-700'"
          >
            <i :class="tab.icon + ' mr-2'"></i>{{ tab.label }}
          </button>
        </div>

        <div class="p-6">
          <!-- SMTP 配置 -->
          <div v-if="activeTab === 'smtp'">
            <h3 class="text-lg font-semibold mb-4">SMTP 邮件配置</h3>
            
            <form @submit.prevent="saveSmtpConfig" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">SMTP 服务器地址</label>
                <input
                  v-model="smtpForm.host"
                  type="text"
                  placeholder="smtp.example.com"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">端口</label>
                  <input
                    v-model.number="smtpForm.port"
                    type="number"
                    placeholder="587"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">加密方式</label>
                  <select
                    v-model="smtpForm.secure"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  >
                    <option :value="false">STARTTLS (推荐)</option>
                    <option :value="true">SSL/TLS</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  v-model="smtpForm.user"
                  type="text"
                  placeholder="your-email@example.com"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  v-model="smtpForm.pass"
                  type="password"
                  placeholder="您的邮箱密码或授权码"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>

              <div class="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  @click="testSmtpConnection"
                  :disabled="isTestingSmtp"
                  class="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
                >
                  {{ isTestingSmtp ? '测试中...' : '测试连接' }}
                </button>

                <button
                  type="submit"
                  :disabled="isSavingSmtp"
                  class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                >
                  {{ isSavingSmtp ? '保存中...' : '保存配置' }}
                </button>
              </div>
            </form>
          </div>

          <!-- 题目管理 -->
          <div v-if="activeTab === 'questions'">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">测评题目管理</h3>
              <div class="flex gap-2">
                <button
                  @click="showEditModal = true; editingQuestion = null"
                  class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                >
                  <i class="fa-solid fa-plus mr-1"></i>新增题目
                </button>
                <button
                  @click="loadQuestions"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
                >
                  <i class="fa-solid fa-refresh mr-1"></i>刷新
                </button>
              </div>
            </div>

            <div class="space-y-4 max-h-[600px] overflow-y-auto">
              <div
                v-for="(question, index) in questions"
                :key="question.id"
                class="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex items-start justify-between mb-2">
                  <span class="font-medium text-primary">题目 {{ question.order }}</span>
                  <div class="flex gap-2">
                    <button
                      @click="editQuestion(question)"
                      class="text-sm text-primary hover:underline"
                    >
                      编辑
                    </button>
                    <button
                      @click="deleteQuestion(question.id)"
                      class="text-sm text-red-500 hover:underline"
                    >
                      删除
                    </button>
                  </div>
                </div>
                
                <p class="text-sm text-gray-600 mb-2">{{ question.scenario }}</p>
                <p class="font-medium mb-2">{{ question.content }}</p>
                
                <div class="space-y-1">
                  <div
                    v-for="option in question.options"
                    :key="option.id"
                    class="text-sm pl-4 border-l-2 border-gray-200"
                  >
                    {{ option.content }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 密码修改 -->
          <div v-if="activeTab === 'password'">
            <h3 class="text-lg font-semibold mb-4">修改管理员密码</h3>
            
            <form @submit.prevent="changePassword" class="space-y-4 max-w-md">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
                <input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  required
                  minlength="6"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
                <p class="text-xs text-neutral mt-1">密码长度至少 6 位</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>

              <button
                type="submit"
                :disabled="isChangingPassword"
                class="w-full px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
              >
                {{ isChangingPassword ? '修改中...' : '修改密码' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/api/admin'
import { questionApi } from '@/api/question'
import QuestionEditModal from '@/components/admin/QuestionEditModal.vue'
import type { Question } from '@career-assessment/shared'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('smtp')

// 弹窗状态
const showEditModal = ref(false)
const editingQuestion = ref<Question | null>(null)

const tabs = [
  { id: 'smtp', label: 'SMTP 配置', icon: 'fa-solid fa-envelope' },
  { id: 'questions', label: '题目管理', icon: 'fa-solid fa-list' },
  { id: 'password', label: '密码修改', icon: 'fa-solid fa-lock' }
]

// SMTP 配置
const smtpForm = ref({
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: ''
})
const isTestingSmtp = ref(false)
const isSavingSmtp = ref(false)

// 题目管理
const questions = ref<Question[]>([])

// 密码修改
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const isChangingPassword = ref(false)

// 方法
const testSmtpConnection = async () => {
  isTestingSmtp.value = true
  try {
    // TODO: 实现 SMTP 测试连接
    alert('SMTP 测试功能即将上线')
  } finally {
    isTestingSmtp.value = false
  }
}

const saveSmtpConfig = async () => {
  isSavingSmtp.value = true
  try {
    const response = await adminApi.updateSmtpConfig(smtpForm.value)
    if (response.data.success) {
      alert('SMTP 配置保存成功')
    }
  } catch (error) {
    console.error('保存 SMTP 配置失败:', error)
    alert('保存失败，请稍后重试')
  } finally {
    isSavingSmtp.value = false
  }
}

const loadQuestions = async () => {
  try {
    const response = await questionApi.getQuestions()
    if (response.data.success && response.data.data) {
      questions.value = response.data.data
    }
  } catch (error) {
    console.error('加载题目失败:', error)
  }
}

const editQuestion = (question: Question) => {
  editingQuestion.value = question
  showEditModal.value = true
}

const handleSaveQuestion = async (data: any) => {
  try {
    if (editingQuestion.value) {
      // 更新题目
      const response = await questionApi.updateQuestion(editingQuestion.value.id, data)
      if (response.data.success) {
        alert('题目更新成功')
        showEditModal.value = false
        loadQuestions()
      }
    } else {
      // 创建新题目
      const response = await questionApi.createQuestion(data)
      if (response.data.success) {
        alert('题目创建成功')
        showEditModal.value = false
        loadQuestions()
      }
    }
  } catch (error) {
    console.error('保存题目失败:', error)
    alert('保存失败，请稍后重试')
  }
}

const deleteQuestion = async (id: string) => {
  if (!confirm('确定要删除这道题目吗？此操作不可恢复。')) {
    return
  }
  
  try {
    const response = await questionApi.deleteQuestion(id)
    if (response.data.success) {
      alert('题目删除成功')
      loadQuestions()
    }
  } catch (error) {
    console.error('删除题目失败:', error)
    alert('删除失败，请稍后重试')
  }
}

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('两次输入的新密码不一致')
    return
  }
  
  if (passwordForm.value.newPassword.length < 6) {
    alert('新密码长度至少 6 位')
    return
  }
  
  isChangingPassword.value = true
  try {
    const response = await adminApi.changePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    )
    if (response.data.success) {
      alert('密码修改成功，请重新登录')
      authStore.logout()
      router.push('/admin/login')
    }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    alert(error.response?.data?.error || '修改失败，请检查当前密码是否正确')
  } finally {
    isChangingPassword.value = false
  }
}

const logout = () => {
  authStore.logout()
  router.push('/admin/login')
}

onMounted(() => {
  loadQuestions()
})
</script>

<!-- 题目编辑弹窗 -->
<QuestionEditModal
  :show="showEditModal"
  :question="editingQuestion"
  @close="showEditModal = false"
  @save="handleSaveQuestion"
/>
