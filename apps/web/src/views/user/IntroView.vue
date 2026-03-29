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
        <div class="flex flex-col md:flex-row items-center justify-between mb-6">
          <button 
            @click="goBack"
            class="flex items-center space-x-1 text-sm px-4 py-2 border border-gray-300 rounded-lg text-neutral hover:bg-gray-100 transition-all duration-200 mb-4 md:mb-0"
          >
            <i class="fa-solid fa-arrow-left"></i>
            <span>返回</span>
          </button>
          <div class="text-right">
            <h2 class="text-2xl font-bold">测评介绍</h2>
            <p class="text-neutral">了解测评流程和目的</p>
          </div>
        </div>

        <div class="prose max-w-none">
          <h3 class="text-lg font-semibold mb-3">测评目的</h3>
          <p class="text-neutral mb-6">
            本测评旨在帮助应届毕业生全面了解自身的职场潜能，包括沟通表达、团队协作、问题解决、学习能力、压力管理、时间管理、责任心、适应能力和职业成熟度等九个维度的能力水平，为求职和职业发展提供参考依据。
          </p>

          <h3 class="text-lg font-semibold mb-3">测评流程</h3>
          <ol class="list-decimal pl-5 space-y-2 text-neutral mb-6">
            <li>填写个人基本信息（姓名、专业、班级等）</li>
            <li>完成31道职场情境测试题</li>
            <li>查看即时结果并下载个人报告</li>
            <li>HR 将通过邮箱发送详细报告和发展建议</li>
          </ol>

          <h3 class="text-lg font-semibold mb-3">注意事项</h3>
          <ul class="list-disc pl-5 space-y-2 text-neutral mb-8">
            <li>测评时间约为15-20分钟，请确保有足够的时间完成</li>
            <li>请根据自己的真实想法和行为倾向进行选择，不必刻意追求"正确答案"</li>
            <li>测评结果仅供参考，不代表对个人能力的最终评价</li>
          </ul>
        </div>

        <div class="text-center">
          <button 
            @click="continueToUserInfo"
            class="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow active:scale-95"
          >
            继续
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const continueToUserInfo = () => {
  router.push('/user-info')
}
</script>
