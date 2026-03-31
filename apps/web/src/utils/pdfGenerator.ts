import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { AssessmentResult } from '@career-assessment/shared'

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
 * 生成简单的测评报告 PDF（使用 jsPDF 直接绘制）
 * @param result 测评结果数据
 * @param userName 用户名
 */
export function generateSimplePDF(result: AssessmentResult, userName: string): void {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 20
  let y = margin
  
  // 标题
  pdf.setFontSize(24)
  pdf.setTextColor(59, 130, 246)
  pdf.text('学生职场潜能测评报告', pageWidth / 2, y, { align: 'center' })
  y += 15
  
  // 副标题
  pdf.setFontSize(12)
  pdf.setTextColor(100, 100, 100)
  pdf.text(`姓名: ${userName}`, margin, y)
  pdf.text(`测评日期: ${new Date().toLocaleDateString('zh-CN')}`, pageWidth - margin, y, { align: 'right' })
  y += 20
  
  // 总分
  pdf.setFontSize(18)
  pdf.setTextColor(0, 0, 0)
  pdf.text(`总体评分: ${result.totalScore}/100`, margin, y)
  y += 10
  
  // 评级
  let rating = ''
  if (result.totalScore >= 90) rating = '优秀'
  else if (result.totalScore >= 80) rating = '良好'
  else if (result.totalScore >= 70) rating = '中等'
  else rating = '待提升'
  
  pdf.setFontSize(14)
  pdf.text(`评级: ${rating}`, margin, y)
  y += 20
  
  // 维度得分
  pdf.setFontSize(16)
  pdf.setTextColor(59, 130, 246)
  pdf.text('各维度得分', margin, y)
  y += 10
  
  pdf.setFontSize(11)
  pdf.setTextColor(0, 0, 0)
  
  result.dimensionScores.forEach((dim) => {
    const label = dim.name || dim.dimension
    const score = dim.score
    const barWidth = 100
    const barHeight = 8
    
    // 维度名称
    pdf.text(label, margin, y)
    
    // 分数
    pdf.text(`${score}分`, margin + barWidth + 10, y)
    
    // 进度条背景
    pdf.setFillColor(229, 231, 235)
    pdf.rect(margin + 60, y - 6, barWidth, barHeight, 'F')
    
    // 进度条
    const fillWidth = (score / 100) * barWidth
    pdf.setFillColor(59, 130, 246)
    pdf.rect(margin + 60, y - 6, fillWidth, barHeight, 'F')
    
    y += 15
  })
  
  // 添加新的一页用于分析建议
  pdf.addPage()
  y = margin
  
  // 优势
  pdf.setFontSize(16)
  pdf.setTextColor(16, 185, 129)
  pdf.text('主要优势', margin, y)
  y += 10

  pdf.setFontSize(11)
  pdf.setTextColor(0, 0, 0)

  if (result.strengths && result.strengths.length > 0) {
    result.strengths.forEach((strength, index) => {
      pdf.text(`${index + 1}. ${strength}`, margin + 5, y)
      y += 8
    })
  } else {
    pdf.text('暂无数据', margin + 5, y)
    y += 8
  }

  y += 10

  // 待提升领域
  pdf.setFontSize(16)
  pdf.setTextColor(245, 158, 11)
  pdf.text('待提升领域', margin, y)
  y += 10

  pdf.setFontSize(11)
  pdf.setTextColor(0, 0, 0)

  if (result.weaknesses && result.weaknesses.length > 0) {
    result.weaknesses.forEach((weakness, index) => {
      pdf.text(`${index + 1}. ${weakness}`, margin + 5, y)
      y += 8
    })
  } else {
    pdf.text('暂无数据', margin + 5, y)
    y += 8
  }
  
  y += 15
  
  // 免责声明
  pdf.setFontSize(9)
  pdf.setTextColor(100, 100, 100)
  const disclaimer = '免责声明：本报告仅根据本次测评的回答内容进行分析，不代表公司对候选人的最终评价。'
  const splitDisclaimer = pdf.splitTextToSize(disclaimer, pageWidth - margin * 2)
  pdf.text(splitDisclaimer, margin, y)
  
  // 保存 PDF
  pdf.save(`测评报告_${userName}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
