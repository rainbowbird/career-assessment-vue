<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-md sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-chart-line text-primary text-2xl"></i>
          <span class="text-lg font-bold">学生职场潜能测评</span>
        </div>
        <button 
          @click="goToAdmin"
          class="flex items-center space-x-1 text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200"
        >
          <i class="fa-solid fa-user-circle"></i>
          <span>管理员登录</span>
        </button>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="container mx-auto px-4 py-8 max-w-6xl">
      <section class="bg-white rounded-xl shadow-md p-8 text-center">
        <div class="mb-8">
          <i class="fa-solid fa-chart-line text-primary text-6xl mb-4"></i>
          <h1 class="text-3xl font-bold mb-2">学生职场潜能测评</h1>
          <p class="text-neutral max-w-xl mx-auto">
            专业的职场潜能测评工具，帮助应届毕业生了解自身职场能力，为求职做好准备
          </p>
        </div>
        <button 
          @click="startAssessment"
          class="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow active:scale-95"
        >
          开始测评
        </button>
      </section>

      <!-- 功能特色 -->
      <section class="mt-12 grid md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow-md p-6 text-center">
          <i class="fa-solid fa-clipboard-check text-primary text-3xl mb-3"></i>
          <h3 class="font-semibold mb-2">专业测评</h3>
          <p class="text-neutral text-sm">31道精心设计的情境题目</p>
        </div>
        <div class="bg-white rounded-xl shadow-md p-6 text-center">
          <i class="fa-solid fa-chart-pie text-secondary text-3xl mb-3"></i>
          <h3 class="font-semibold mb-2">多维度分析</h3>
          <p class="text-neutral text-sm">9个维度全面评估职场潜能</p>
        </div>
        <div class="bg-white rounded-xl shadow-md p-6 text-center">
          <i class="fa-solid fa-file-pdf text-accent text-3xl mb-3"></i>
          <h3 class="font-semibold mb-2">详细报告</h3>
          <p class="text-neutral text-sm">生成专业的 PDF 测评报告</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const startAssessment = () => {
  router.push('/intro')
}

const goToAdmin = () => {
  router.push('/admin/login')
}
</script>
