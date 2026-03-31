import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { AssessmentResult, Dimension } from '@career-assessment/shared'
import { DimensionLabels } from '@career-assessment/shared'

/**
 * 生成测评报告 PDF
 * @param element 要转换为 PDF 的 HTML 元素
 * @param result 测评结果数据
 * @param filename 文件名
 */
export async function generatePDF(
  element: HTMLElement,
  result: AssessmentResult,
  filename: string
): Promise<void> {
  try {
    // 显示加载状态
    const loadingDiv = document.createElement('div')
    loadingDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `
    loadingDiv.innerHTML = '<div style="background: white; padding: 20px; border-radius: 8px; font-weight: bold;">正在生成 PDF...</div>'
    document.body.appendChild(loadingDiv)

    // 使用 html2canvas 捕获页面
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      backgroundColor: '#ffffff'
    })

    // 创建 PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    // 计算图像尺寸以适应 PDF
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    let imgY = 10
    
    // 将 canvas 转换为图片数据
    const imgData = canvas.toDataURL('image/png')
    
    // 计算需要多少页
    const scaledHeight = imgHeight * ratio * (pdfWidth / (imgWidth * ratio))
    let heightLeft = scaledHeight
    let position = 0
    
    // 添加第一页
    pdf.addImage(imgData, 'PNG', imgX, imgY, pdfWidth - 20, scaledHeight)
    heightLeft -= pdfHeight
    
    // 如果内容超过一页，添加更多页
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', imgX, position, pdfWidth - 20, scaledHeight)
      heightLeft -= pdfHeight
    }
    
    // 保存 PDF
    pdf.save(filename)
    
    // 移除加载提示
    document.body.removeChild(loadingDiv)
  } catch (error) {
    console.error('生成 PDF 失败:', error)
    throw error
  }
}

/**
 * 生成简单的测评报告 PDF（使用 html2canvas 渲染带中文的 HTML）
 * @param result 测评结果数据
 * @param userName 用户名
 */
export async function generateSimplePDF(result: AssessmentResult, userName: string): Promise<void> {
  // 创建临时容器用于渲染报告内容
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 800px;
    padding: 40px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  `
  
  // 获取评级文本
  let ratingText = ''
  if (result.totalScore >= 90) ratingText = '优秀'
  else if (result.totalScore >= 80) ratingText = '良好'
  else if (result.totalScore >= 70) ratingText = '中等'
  else ratingText = '待提升'
  
  // 构建 HTML 内容
  container.innerHTML = `
    <div style="max-width: 720px; margin: 0 auto;">
      <!-- 标题 -->
      <h1 style="text-align: center; color: #3b82f6; font-size: 28px; margin-bottom: 10px; font-weight: bold;">
        学生职场潜能测评报告
      </h1>
      
      <!-- 副标题 -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; color: #666; font-size: 14px;">
        <span>姓名: ${userName}</span>
        <span>测评日期: ${new Date().toLocaleDateString('zh-CN')}</span>
      </div>
      
      <!-- 总分 -->
      <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
          总体评分: ${result.totalScore}/100
        </div>
        <div style="font-size: 16px; color: #3b82f6;">
          评级: ${ratingText}
        </div>
      </div>
      
      <!-- 各维度得分 -->
      <h2 style="font-size: 18px; color: #3b82f6; margin-bottom: 15px; font-weight: bold;">各维度得分</h2>
      <div style="margin-bottom: 30px;">
        ${result.dimensionScores.map(dim => {
          const label = DimensionLabels[dim.dimension as Dimension] || dim.dimension
          const score = dim.score
          const percentage = Math.min(score, 100)
          return `
            <div style="margin-bottom: 12px; display: flex; align-items: center;">
              <span style="width: 100px; font-size: 14px; color: #333;">${label}</span>
              <div style="flex: 1; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin: 0 10px;">
                <div style="width: ${percentage}%; height: 100%; background: #3b82f6; border-radius: 10px;"></div>
              </div>
              <span style="width: 50px; font-size: 14px; color: #666; text-align: right;">${score}分</span>
            </div>
          `
        }).join('')}
      </div>
      
      <!-- 主要优势 -->
      <h2 style="font-size: 18px; color: #10b981; margin-bottom: 15px; font-weight: bold;">主要优势</h2>
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #bbf7d0;">
        ${result.strengths && result.strengths.length > 0 
          ? result.strengths.map((s, i) => `
              <div style="margin-bottom: 8px; font-size: 14px; color: #166534;">
                ${i + 1}. ${DimensionLabels[s as Dimension] || s}
              </div>
            `).join('')
          : '<div style="color: #666;">暂无数据</div>'
        }
      </div>
      
      <!-- 待提升领域 -->
      <h2 style="font-size: 18px; color: #f59e0b; margin-bottom: 15px; font-weight: bold;">待提升领域</h2>
      <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #fcd34d;">
        ${result.weaknesses && result.weaknesses.length > 0 
          ? result.weaknesses.map((w, i) => `
              <div style="margin-bottom: 8px; font-size: 14px; color: #92400e;">
                ${i + 1}. ${DimensionLabels[w as Dimension] || w}
              </div>
            `).join('')
          : '<div style="color: #666;">暂无数据</div>'
        }
      </div>
      
      <!-- 免责声明 -->
      <div style="font-size: 11px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        免责声明：本报告仅根据本次测评的回答内容进行分析，不代表公司对候选人的最终评价。
      </div>
    </div>
  `
  
  document.body.appendChild(container)
  
  try {
    // 使用 html2canvas 将 HTML 渲染为图片
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 800,
      height: container.scrollHeight
    })
    
    // 创建 PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight)
    
    const scaledWidth = imgWidth * ratio
    const scaledHeight = imgHeight * ratio
    
    // 如果内容超出一页，需要分页
    let heightLeft = scaledHeight
    let position = 10
    
    // 添加第一页
    pdf.addImage(imgData, 'PNG', 10, position, scaledWidth, scaledHeight)
    heightLeft -= (pdfHeight - 20)
    
    // 如果内容超过一页，添加更多页
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, scaledWidth, scaledHeight)
      heightLeft -= (pdfHeight - 20)
    }
    
    // 保存 PDF
    pdf.save(`测评报告_${userName}_${new Date().toISOString().slice(0, 10)}.pdf`)
  } finally {
    // 清理临时元素
    document.body.removeChild(container)
  }
}
