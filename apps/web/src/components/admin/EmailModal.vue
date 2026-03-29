<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <!-- 头部 -->
      <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
        <h2 class="text-xl font-bold">发送邮件</h2>
        <button
          @click="close"
          class="text-neutral hover:text-gray-700 transition-colors"
        >
          <i class="fa-solid fa-times text-xl"></i>
        </button>
      </div>

      <!-- 内容 -->
      <div class="p-6 space-y-4">
        <!-- SMTP 检查提示 -->
        <div v-if="!smtpConfigured" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div class="flex items-start">
            <i class="fa-solid fa-exclamation-triangle text-amber-500 mt-1 mr-3"></i>
            <div>
              <p class="font-medium text-amber-800">SMTP 未配置</p>
              <p class="text-sm text-amber-700 mt-1">
                请先前往系统配置页面设置 SMTP 服务器，才能发送邮件。
              </p>
              <router-link
                to="/admin/settings"
                class="inline-block mt-2 text-primary hover:underline"
                @click="close"
              >
                去配置 SMTP →
              </router-link>
            </div>
          </div>
        </div>

        <!-- 收件人 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            收件人邮箱 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.to"
            type="email"
            required
            :disabled="!smtpConfigured"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none disabled:bg-gray-100"
            placeholder="recipient@example.com"
          />
        </div>

        <!-- 主题 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            邮件主题 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.subject"
            type="text"
            required
            :disabled="!smtpConfigured"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none disabled:bg-gray-100"
            placeholder="请输入邮件主题"
          />
        </div>

        <!-- 正文 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            邮件正文 <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="form.body"
            rows="10"
            required
            :disabled="!smtpConfigured"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none disabled:bg-gray-100"
            placeholder="请输入邮件内容，支持 HTML 格式"
          ></textarea>
          <p class="text-xs text-neutral mt-1">支持 HTML 格式</p>
        </div>

        <!-- 附件提示 -->
        <div v-if="attachmentName" class="bg-gray-50 rounded-lg p-3">
          <div class="flex items-center">
            <i class="fa-solid fa-paperclip text-neutral mr-2"></i>
            <span class="text-sm">附件: {{ attachmentName }}</span>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
        <button
          @click="close"
          class="px-6 py-2 border border-gray-300 rounded-lg text-neutral hover:bg-gray-100 transition-colors"
        >
          取消
        </button>
        <button
          @click="sendEmail"
          :disabled="!isValid || !smtpConfigured || isSending"
          class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
        >
          <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i>
          <i v-else class="fa-solid fa-paper-plane mr-2"></i>
          {{ isSending ? '发送中...' : '发送邮件' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '@/api/admin'

interface Props {
  show: boolean
  assessmentId: string
  defaultTo?: string
  attachmentName?: string
  smtpConfigured: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  sent: []
}>()

// 表单数据
const form = ref({
  to: props.defaultTo || '',
  subject: '您的职场潜能测评报告',
  body: `尊敬的同学，您好！

感谢您参与职场潜能测评。

您的详细测评报告已经生成，请查收附件。

如有任何问题，欢迎随时联系我们。

祝您求职顺利！

此致
敬礼！`
})

const isSending = ref(false)

// 计算属性
const isValid = computed(() => {
  return form.value.to.trim() && 
         form.value.subject.trim() && 
         form.value.body.trim()
})

// 方法
const close = () => {
  emit('close')
}

const sendEmail = async () => {
  if (!isValid.value || isSending.value) return
  
  isSending.value = true
  
  try {
    const response = await adminApi.sendEmail(props.assessmentId, {
      to: form.value.to,
      subject: form.value.subject,
      body: form.value.body.replace(/\n/g, '<br>')
    })
    
    if (response.data.success) {
      alert('邮件发送成功！')
      emit('sent')
      close()
    } else {
      alert(response.data.error || '邮件发送失败')
    }
  } catch (error: any) {
    console.error('发送邮件失败:', error)
    alert(error.response?.data?.error || '邮件发送失败，请检查 SMTP 配置')
  } finally {
    isSending.value = false
  }
}

// 初始化
onMounted(() => {
  if (props.defaultTo) {
    form.value.to = props.defaultTo
  }
})
</script>
