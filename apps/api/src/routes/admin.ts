import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@career-assessment/database'
import { authenticate, type AuthRequest } from '../middleware/auth'
import type { Dimension } from '@career-assessment/shared'
import { DimensionLabels } from '@career-assessment/shared'

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
      COMMUNICATION: totalAssessments > 0 ? Math.round(dimensionSums.COMMUNICATION / totalAssessments) : 0,
      TEAMWORK: totalAssessments > 0 ? Math.round(dimensionSums.TEAMWORK / totalAssessments) : 0,
      PROBLEM_SOLVING: totalAssessments > 0 ? Math.round(dimensionSums.PROBLEM_SOLVING / totalAssessments) : 0,
      LEARNING: totalAssessments > 0 ? Math.round(dimensionSums.LEARNING / totalAssessments) : 0,
      CAREER_AWARENESS: totalAssessments > 0 ? Math.round(dimensionSums.CAREER_AWARENESS / totalAssessments) : 0,
      INNOVATION: totalAssessments > 0 ? Math.round(dimensionSums.INNOVATION / totalAssessments) : 0,
      TIME_MANAGEMENT: totalAssessments > 0 ? Math.round(dimensionSums.TIME_MANAGEMENT / totalAssessments) : 0,
      EMOTIONAL: totalAssessments > 0 ? Math.round(dimensionSums.EMOTIONAL / totalAssessments) : 0,
      LEADERSHIP: totalAssessments > 0 ? Math.round(dimensionSums.LEADERSHIP / totalAssessments) : 0
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
    
    // 专业分布
    const majorDistribution = await prisma.user.groupBy({
      by: ['major'],
      _count: { major: true }
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
            question: true,
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

// 检查 SMTP 配置
router.get('/smtp/check', async (req: AuthRequest, res, next) => {
  try {
    const admin = await prisma.admin.findFirst()
    const configured = admin?.smtpConfig ? true : false
    
    res.json({
      success: true,
      data: { configured }
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
    
    // 创建邮件队列记录（模拟发送）
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
      message: '邮件已添加到发送队列'
    })
  } catch (error) {
    next(error)
  }
})

// 导出数据
router.post('/export', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      format: z.enum(['pdf', 'excel']),
      ids: z.array(z.string()).optional()
    })
    
    const { format, ids } = schema.parse(req.body)
    
    // TODO: 实现数据导出功能
    res.json({
      success: true,
      message: `${format.toUpperCase()} 导出功能即将上线`
    })
  } catch (error) {
    next(error)
  }
})

export { router as adminRouter }
