import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'
import { prisma } from '@career-assessment/database'
import { authenticate, type AuthRequest } from '../middleware/auth'
import type { Dimension } from '@career-assessment/shared'
import { DimensionLabels, ReviewStatusLabels } from '@career-assessment/shared'
import { testSMTPConnection, sendEmail } from '../utils/emailService'

const router = Router()

router.use(authenticate)

// 获取统计数据
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const totalAssessments = await prisma.assessment.count({
      where: { status: 'COMPLETED' }
    })
    
    const scoreData = await prisma.assessment.aggregate({
      where: { status: 'COMPLETED' },
      _avg: { totalScore: true },
      _sum: { duration: true }
    })
    
    const averageTotalScore = Math.round(scoreData._avg.totalScore || 0)
    const averageCompletionTime = totalAssessments > 0 
      ? Math.round((scoreData._sum.duration || 0) / totalAssessments)
      : 0
    
    // 各维度平均分
    const allAssessments = await prisma.assessment.findMany({
      where: { status: 'COMPLETED' }
    })
    
    const dimensionSums: Record<Dimension, number> = {
      COMMUNICATION: 0, TEAMWORK: 0, PROBLEM_SOLVING: 0, LEARNING: 0,
      CAREER_AWARENESS: 0, INNOVATION: 0, TIME_MANAGEMENT: 0, EMOTIONAL: 0, LEADERSHIP: 0
    }
    
    allAssessments.forEach(assessment => {
      if (assessment.dimensionScores) {
        const scores = JSON.parse(assessment.dimensionScores as string) as Record<Dimension, number>
        Object.entries(scores).forEach(([dim, score]) => {
          dimensionSums[dim as Dimension] += score
        })
      }
    })
    
    const dimensionAverages: Record<Dimension, number> = {
      COMMUNICATION: totalAssessments > 0 ? Math.min(100, Math.round(dimensionSums.COMMUNICATION / totalAssessments)) : 0,
      TEAMWORK: totalAssessments > 0 ? Math.min(100, Math.round(dimensionSums.TEAMWORK / totalAssessments)) : 0,
      PROBLEM_SOLVING: totalAssessments > 0 ? Math.min(100, Math.round(dimensionSums.PROBLEM_SOLVING / totalAssessments)) : 0,
      LEARNING: totalAssessments > 0 ? Math.min(100, Math.round(dimensionSums.LEARNING / totalAssessments)) : 0,
      CAREER_AWARENESS: totalAssessments > 0 ? Math.min(100, Math.round(dimensionSums.CAREER_AWARENESS / totalAssessments)) : 0,
      INNOVATION: totalAssessments > 0 ? Math.min(100, Math.round(dimensionSums.INNOVATION / totalAssessments)) : 0,
      TIME_MANAGEMENT: totalAssessments > 0 ? Math.min(100, Math.round(dimensionSums.TIME_MANAGEMENT / totalAssessments)) : 0,
      EMOTIONAL: totalAssessments > 0 ? Math.min(100, Math.round(dimensionSums.EMOTIONAL / totalAssessments)) : 0,
      LEADERSHIP: totalAssessments > 0 ? Math.min(100, Math.round(dimensionSums.LEADERSHIP / totalAssessments)) : 0
    }
    
    // 成绩分布
    const ranges = [
      { min: 0, max: 59, label: '待提升' },
      { min: 60, max: 69, label: '中等' },
      { min: 70, max: 79, label: '良好' },
      { min: 80, max: 89, label: '优秀' },
      { min: 90, max: 100, label: '卓越' }
    ]
    
    const scoreDistribution = await Promise.all(
      ranges.map(async range => ({
        range: range.label,
        count: await prisma.assessment.count({
          where: {
            status: 'COMPLETED',
            totalScore: {
              gte: range.min,
              lte: range.max
            }
          }
        })
      }))
    )
    
    // 专业分布 - 只统计已完成测评的用户
    const majorDistribution = await prisma.user.groupBy({
      by: ['major'],
      where: {
        assessments: {
          some: {
            status: 'COMPLETED'
          }
        }
      },
      _count: { 
        major: true
      }
    })
    
    res.json({
      success: true,
      data: {
        totalAssessments,
        averageTotalScore,
        averageCompletionTime,
        dimensionAverages,
        scoreDistribution,
        majorDistribution: majorDistribution.map(m => ({
          major: m.major,
          count: m._count.major
        }))
      }
    })
  } catch (error) {
    next(error)
  }
})

// 获取测评列表
router.get('/assessments', async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const status = req.query.status as string
    
    const where = status ? { reviewStatus: status as any } : {}
    
    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.assessment.count({ where })
    ])
    
    res.json({
      success: true,
      data: {
        items: assessments.map(a => ({
          id: a.id,
          userName: a.user.name,
          userMajor: a.user.major,
          userClass: a.user.class,
          totalScore: a.totalScore,
          reviewStatus: a.reviewStatus,
          createdAt: a.createdAt.toISOString()
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    next(error)
  }
})

// 获取测评详情
router.get('/assessments/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        user: true,
        answers: {
          include: {
            option: true
          }
        }
      }
    })
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: '测评不存在'
      })
    }
    
    const dimensionScores = assessment.dimensionScores
      ? JSON.parse(assessment.dimensionScores as string)
      : {}
    
    res.json({
      success: true,
      data: {
        ...assessment,
        dimensionScores,
        dimensionLabels: DimensionLabels
      }
    })
  } catch (error) {
    next(error)
  }
})

// 删除测评记录
router.delete('/assessments/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    
    // 先检查测评是否存在
    const assessment = await prisma.assessment.findUnique({
      where: { id }
    })
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: '测评不存在'
      })
    }
    
    // 删除相关的答案记录
    await prisma.answer.deleteMany({
      where: { assessmentId: id }
    })
    
    // 删除测评记录
    await prisma.assessment.delete({
      where: { id }
    })
    
    res.json({
      success: true,
      message: '测评记录已删除'
    })
  } catch (error) {
    next(error)
  }
})

// 更新审阅状态
router.patch('/assessments/:id/status', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const schema = z.object({
      status: z.enum(['PENDING', 'REVIEWED', 'SENT'])
    })
    
    const { status } = schema.parse(req.body)
    
    await prisma.assessment.update({
      where: { id },
      data: { reviewStatus: status }
    })
    
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// 题目管理 API - 获取所有题目（含分值等完整信息）
router.get('/questions', async (req: AuthRequest, res, next) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })
    
    res.json({
      success: true,
      data: questions
    })
  } catch (error) {
    next(error)
  }
})

// 获取单个题目
router.get('/questions/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: '题目不存在'
      })
    }
    
    res.json({
      success: true,
      data: question
    })
  } catch (error) {
    next(error)
  }
})

// 创建题目
router.post('/questions', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      scenario: z.string().min(1),
      content: z.string().min(1),
      options: z.array(z.object({
        content: z.string().min(1),
        score: z.number().int().min(0).max(100),
        dimension: z.enum(['COMMUNICATION', 'TEAMWORK', 'PROBLEM_SOLVING', 'LEARNING', 'CAREER_AWARENESS', 'INNOVATION', 'TIME_MANAGEMENT', 'EMOTIONAL', 'LEADERSHIP'])
      })).min(2)
    })
    
    const data = schema.parse(req.body)
    
    // 获取当前最大 order
    const maxOrder = await prisma.question.aggregate({
      _max: { order: true }
    })
    
    const question = await prisma.question.create({
      data: {
        order: (maxOrder._max.order || 0) + 1,
        scenario: data.scenario,
        content: data.content,
        options: {
          create: data.options.map((opt, index) => ({
            order: index + 1,
            content: opt.content,
            score: opt.score,
            dimension: opt.dimension
          }))
        }
      },
      include: {
        options: true
      }
    })
    
    res.status(201).json({
      success: true,
      data: question
    })
  } catch (error) {
    next(error)
  }
})

// 更新题目
router.put('/questions/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const schema = z.object({
      scenario: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      options: z.array(z.object({
        id: z.string().optional(),
        content: z.string().min(1),
        score: z.number().int().min(0).max(100),
        dimension: z.enum(['COMMUNICATION', 'TEAMWORK', 'PROBLEM_SOLVING', 'LEARNING', 'CAREER_AWARENESS', 'INNOVATION', 'TIME_MANAGEMENT', 'EMOTIONAL', 'LEADERSHIP'])
      })).optional()
    })
    
    const data = schema.parse(req.body)
    
    // 更新题目基本信息
    const question = await prisma.question.update({
      where: { id },
      data: {
        scenario: data.scenario,
        content: data.content
      }
    })
    
    // 如果有选项数据，更新选项
    if (data.options) {
      // 删除旧选项
      await prisma.option.deleteMany({
        where: { questionId: id }
      })
      
      // 创建新选项
      await prisma.option.createMany({
        data: data.options.map((opt, index) => ({
          questionId: id,
          order: index + 1,
          content: opt.content,
          score: opt.score,
          dimension: opt.dimension
        }))
      })
    }
    
    // 返回更新后的题目
    const updatedQuestion = await prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { order: 'asc' } } }
    })
    
    res.json({
      success: true,
      data: updatedQuestion
    })
  } catch (error) {
    next(error)
  }
})

// 删除题目
router.delete('/questions/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    
    await prisma.question.delete({
      where: { id }
    })
    
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// 发送邮件
router.post('/assessments/:id/send-email', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const schema = z.object({
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1)
    })
    
    const { to, subject, body } = schema.parse(req.body)
    
    // 检查 SMTP 配置
    const admin = await prisma.admin.findFirst()
    if (!admin?.smtpConfig) {
      return res.status(400).json({
        success: false,
        error: 'SMTP 未配置，请先配置邮件服务器'
      })
    }
    
    // 解析 SMTP 配置
    const smtpConfig = JSON.parse(admin.smtpConfig as string)
    
    // 发送真实邮件
    const result = await sendEmail(smtpConfig, {
      to,
      subject,
      body
    })
    
    if (!result.success) {
      // 记录失败
      await prisma.emailQueue.create({
        data: {
          assessmentId: id,
          to,
          subject,
          body,
          status: 'FAILED',
          error: result.error
        }
      })
      
      return res.status(500).json({
        success: false,
        error: result.error || '邮件发送失败'
      })
    }
    
    // 记录成功
    await prisma.emailQueue.create({
      data: {
        assessmentId: id,
        to,
        subject,
        body,
        status: 'SENT',
        sentAt: new Date()
      }
    })
    
    // 更新测评状态为已发送
    await prisma.assessment.update({
      where: { id },
      data: { reviewStatus: 'SENT' }
    })
    
    res.json({
      success: true,
      message: '邮件发送成功',
      messageId: result.messageId
    })
  } catch (error) {
    next(error)
  }
})

// 测试 SMTP 连接
router.post('/smtp/test', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      host: z.string().min(1),
      port: z.number().int(),
      secure: z.boolean(),
      user: z.string().email(),
      pass: z.string().min(1)
    })
    
    const config = schema.parse(req.body)
    
    // 测试连接
    const result = await testSMTPConnection(config)
    
    if (result.success) {
      res.json({
        success: true,
        message: 'SMTP 连接测试成功'
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'SMTP 连接测试失败'
      })
    }
  } catch (error) {
    next(error)
  }
})

// 导出数据 - 已实现真实导出功能
router.get('/export/excel', async (req: AuthRequest, res, next) => {
  try {
    // 获取所有已完成的测评数据
    const assessments = await prisma.assessment.findMany({
      where: { status: 'COMPLETED' },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // 准备 Excel 数据
    const data = assessments.map(a => {
      const dimensionScores = a.dimensionScores 
        ? JSON.parse(a.dimensionScores as string) 
        : {}
      
      return {
        '姓名': a.user.name,
        '专业': a.user.major,
        '班级': a.user.class,
        '学校': a.user.school,
        '学历': a.user.education,
        '邮箱': a.user.email,
        '手机号': a.user.phone,
        '总分': a.totalScore,
        '沟通表达': dimensionScores.COMMUNICATION || 0,
        '团队协作': dimensionScores.TEAMWORK || 0,
        '问题解决': dimensionScores.PROBLEM_SOLVING || 0,
        '学习适应': dimensionScores.LEARNING || 0,
        '职业认知': dimensionScores.CAREER_AWARENESS || 0,
        '创新思维': dimensionScores.INNOVATION || 0,
        '时间管理': dimensionScores.TIME_MANAGEMENT || 0,
        '情绪管理': dimensionScores.EMOTIONAL || 0,
        '领导力': dimensionScores.LEADERSHIP || 0,
        '审阅状态': ReviewStatusLabels[a.reviewStatus as keyof typeof ReviewStatusLabels] || a.reviewStatus,
        '测评日期': a.createdAt.toLocaleDateString('zh-CN')
      }
    })

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    
    // 设置列宽
    const colWidths = [
      { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 8 },
      { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }
    ]
    ws['!cols'] = colWidths

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '测评记录')

    // 生成 Excel 文件
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    const filename = `assessments_${new Date().toISOString().slice(0, 10)}.xlsx`
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`)
    
    // 发送文件
    res.send(buffer)
  } catch (error) {
    next(error)
  }
})

// 导出单条记录为 PDF
router.get('/export/pdf/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        user: true
      }
    })

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: '测评不存在'
      })
    }

    const dimensionScores = assessment.dimensionScores 
      ? JSON.parse(assessment.dimensionScores as string) 
      : {}

    // 返回 JSON 数据，前端将使用 html2canvas 生成 PDF
    res.json({
      success: true,
      data: {
        id: assessment.id,
        user: assessment.user,
        totalScore: assessment.totalScore,
        dimensionScores,
        duration: assessment.duration,
        createdAt: assessment.createdAt,
        completedAt: assessment.completedAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// 检查 SMTP 配置和连接状态
router.get('/smtp/check', async (req: AuthRequest, res, next) => {
  try {
    const admin = await prisma.admin.findFirst()
    
    // 检查配置是否存在
    if (!admin?.smtpConfig) {
      return res.json({
        success: true,
        data: { 
          configured: false,
          connected: false,
          message: 'SMTP 未配置'
        }
      })
    }
    
    // 配置存在，测试连接是否可达
    const config = admin.smtpConfig as any
    const result = await testSMTPConnection(config)
    
    res.json({
      success: true,
      data: { 
        configured: true,
        connected: result.success,
        message: result.success ? 'SMTP 服务正常' : (result.error || 'SMTP 连接失败')
      }
    })
  } catch (error) {
    next(error)
  }
})

// 更新 SMTP 配置
router.post('/smtp/config', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      host: z.string().min(1),
      port: z.number().int(),
      secure: z.boolean(),
      user: z.string().email(),
      pass: z.string().min(1)
    })
    
    const config = schema.parse(req.body)
    
    const admin = await prisma.admin.findFirst()
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: '管理员账号不存在'
      })
    }
    
    await prisma.admin.update({
      where: { id: admin.id },
      data: { smtpConfig: JSON.stringify(config) }
    })
    
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// 修改管理员密码
router.post('/change-password', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      oldPassword: z.string().min(1),
      newPassword: z.string().min(6)
    })
    
    const { oldPassword, newPassword } = schema.parse(req.body)
    
    const admin = await prisma.admin.findFirst()
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: '管理员账号不存在'
      })
    }
    
    const isValid = await bcrypt.compare(oldPassword, admin.password)
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '当前密码错误'
      })
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    })
    
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export { router as adminRouter }
