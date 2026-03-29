<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <!-- 头部 -->
      <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
        <h2 class="text-xl font-bold">
          {{ isEditing ? '编辑题目' : '新建题目' }}
        </h2>
        <button
          @click="close"
          class="text-neutral hover:text-gray-700 transition-colors"
        >
          <i class="fa-solid fa-times text-xl"></i>
        </button>
      </div>

      <!-- 表单内容 -->
      <div class="p-6 space-y-6">
        <!-- 题目序号 -->
        <div v-if="!isEditing">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            题目序号 <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="form.order"
            type="number"
            min="1"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            placeholder="例如: 32"
          />
        </div>

        <!-- 情境描述 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            情境描述 <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="form.scenario"
            rows="3"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
            placeholder="描述一个职场情境..."
          ></textarea>
        </div>

        <!-- 问题内容 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            问题 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.content"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            placeholder="你会怎么做？"
          />
        </div>

        <!-- 选项列表 -->
        <div>
          <div class="flex justify-between items-center mb-3">
            <label class="block text-sm font-medium text-gray-700">
              选项 <span class="text-red-500">*</span>
            </label>
            <span class="text-xs text-neutral">至少 2 个选项，建议 4-5 个</span>
          </div>

          <div class="space-y-3">
            <div
              v-for="(option, index) in form.options"
              :key="index"
              class="border rounded-lg p-4 bg-gray-50"
            >
              <div class="flex items-start gap-3">
                <span class="font-medium text-primary mt-2">{{ String.fromCharCode(65 + index) }}</span>
                <div class="flex-1 space-y-3">
                  <!-- 选项内容 -->
                  <input
                    v-model="option.content"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    :placeholder="`选项 ${String.fromCharCode(65 + index)} 内容`"
                  />

                  <!-- 分值和维度 -->
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs text-neutral mb-1">分值 (0-100)</label>
                      <input
                        v-model.number="option.score"
                        type="number"
                        min="0"
                        max="100"
                        required
                        class="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-xs text-neutral mb-1">影响维度</label>
                      <select
                        v-model="option.dimension"
                        required
                        class="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                      >
                        <option value="">选择维度</option>
                        <option value="COMMUNICATION">沟通表达</option>
                        <option value="TEAMWORK">团队协作</option>
                        <option value="PROBLEM_SOLVING">问题解决</option>
                        <option value="LEARNING">学习适应</option>
                        <option value="CAREER_AWARENESS">职业认知</option>
                        <option value="INNOVATION">创新思维</option>
                        <option value="TIME_MANAGEMENT">时间管理</option>
                        <option value="EMOTIONAL">情绪管理</option>
                        <option value="LEADERSHIP">领导力</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- 删除选项按钮 -->
                <button
                  v-if="form.options.length > 2"
                  @click="removeOption(index)"
                  class="text-red-500 hover:text-red-700 mt-2"
                  title="删除选项"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- 添加选项按钮 -->
          <button
            v-if="form.options.length < 6"
            @click="addOption"
            class="mt-3 px-4 py-2 border border-dashed border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
          >
            <i class="fa-solid fa-plus mr-1"></i> 添加选项
          </button>
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
          @click="save"
          :disabled="isSaving || !isValid"
          class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Question } from '@career-assessment/shared'

interface Props {
  show: boolean
  question?: Question | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

// 表单数据
const form = ref({
  order: 1,
  scenario: '',
  content: '',
  options: [
    { content: '', score: 80, dimension: '' },
    { content: '', score: 60, dimension: '' }
  ]
})

const isSaving = ref(false)

// 计算属性
const isEditing = computed(() => !!props.question)

const isValid = computed(() => {
  if (!form.value.scenario.trim()) return false
  if (!form.value.content.trim()) return false
  if (form.value.options.length < 2) return false
  
  return form.value.options.every(opt => 
    opt.content.trim() && 
    opt.score >= 0 && 
    opt.score <= 100 && 
    opt.dimension
  )
})

// 监听 question 变化，初始化表单
watch(() => props.question, (newQuestion) => {
  if (newQuestion) {
    form.value = {
      order: newQuestion.order,
      scenario: newQuestion.scenario,
      content: newQuestion.content,
      options: newQuestion.options.map(opt => ({
        id: opt.id,
        content: opt.content,
        score: opt.score,
        dimension: opt.dimension
      }))
    }
  } else {
    // 重置表单
    form.value = {
      order: 1,
      scenario: '',
      content: '',
      options: [
        { content: '', score: 80, dimension: '' },
        { content: '', score: 60, dimension: '' }
      ]
    }
  }
}, { immediate: true })

// 方法
const close = () => {
  emit('close')
}

const addOption = () => {
  if (form.value.options.length < 6) {
    form.value.options.push({
      content: '',
      score: 60,
      dimension: ''
    })
  }
}

const removeOption = (index: number) => {
  if (form.value.options.length > 2) {
    form.value.options.splice(index, 1)
  }
}

const save = async () => {
  if (!isValid.value) return
  
  isSaving.value = true
  
  try {
    const data = {
      ...form.value,
      options: form.value.options.map((opt, index) => ({
        ...opt,
        order: index + 1
      }))
    }
    
    emit('save', data)
  } finally {
    isSaving.value = false
  }
}
</script>
