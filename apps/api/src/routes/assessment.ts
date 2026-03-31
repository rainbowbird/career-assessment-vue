import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@career-assessment/database'
import { authenticate } from '../middleware/auth'
import type { Dimension } from '@career-assessment/shared'

const router = Router()

// 创建测评（每人一份数据模式）
router.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      major: z.string().min(1),
      class: z.string().min(1),
      email: z.string().email(),
      school: z.string().min(1),
      phone: z.string().min(1),
      education: z.enum(['BACHELOR', 'MASTER', 'DOCTOR', 'COLLEGE'])
    })

    const data = schema.parse(req.body)

    // 检查是否已存在该邮箱的用户
    let user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (user) {
      // 用户已存在，检查是否已有测评记录
      const existingAssessment = await prisma.assessment.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      if (existingAssessment) {
        if (existingAssessment.status === 'COMPLETED') {
          // 已有完成的测评，不允许重复创建
          return res.status(400).json({
            success: false,
            error: '您已完成测评，每人仅限一次测评机会',
            code: 'ALREADY_COMPLETED'
          })
        } else {
          // 有未完成的测评，返回继续测评
          return res.status(200).json({
            success: true,
            data: {
              id: existingAssessment.id,
              message: '继续之前的测评',
              isExisting: true
            }
          })
        }
      }

      // 用户存在但没有测评记录，更新用户信息并创建新测评
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name,
          major: data.major,
          class: data.class,
          school: data.school,
          phone: data.phone,
          education: data.education
        }
      })
    } else {
      // 创建新用户
      user = await prisma.user.create({
        data
      })
    }

    // 创建测评记录
    const assessment = await prisma.assessment.create({
      data: {
        userId: user.id,
        startedAt: new Date()
      }
    })

    res.status(201).json({
      success: true,
      data: { id: assessment.id }
    })
  } catch (error) {
    next(error)
  }
})

// 提交答案
router.post('/:id/answers', async (req, res, next) => {
  try {
    const { id } = req.params
    const schema = z.object({
      questionId: z.string().uuid(),
      optionId: z.string().uuid()
    })
    
    const { questionId, optionId } = schema.parse(req.body)
    
    // 检查是否已存在答案
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        assessmentId: id,
        questionId
      }
    })
    
    if (existingAnswer) {
      await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: { optionId }
      })
    } else {
      await prisma.answer.create({
        data: {
          assessmentId: id,
          questionId,
          optionId
        }
      })
    }
    
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// 完成测评并计算得分
router.post('/:id/complete', async (req, res, next) => {
  try {
    const { id } = req.params
    
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
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
    
    // 计算各维度得分（收集每个维度的所有分数）
    const dimensionScoresMap: Record<Dimension, number[]> = {
      COMMUNICATION: [],
      TEAMWORK: [],
      PROBLEM_SOLVING: [],
      LEARNING: [],
      CAREER_AWARENESS: [],
      INNOVATION: [],
      TIME_MANAGEMENT: [],
      EMOTIONAL: [],
      LEADERSHIP: []
    }

    assessment.answers.forEach(answer => {
      if (answer.option) {
        dimensionScoresMap[answer.option.dimension].push(answer.option.score)
      }
    })

    // 计算每个维度的平均分（0-100）
    const dimensionScores: Record<Dimension, number> = {
      COMMUNICATION: 0,
      TEAMWORK: 0,
      PROBLEM_SOLVING: 0,
      LEARNING: 0,
      CAREER_AWARENESS: 0,
      INNOVATION: 0,
      TIME_MANAGEMENT: 0,
      EMOTIONAL: 0,
      LEADERSHIP: 0
    }

    Object.keys(dimensionScoresMap).forEach(dim => {
      const scores = dimensionScoresMap[dim as Dimension]
      if (scores.length > 0) {
        // 计算平均分并四舍五入
        dimensionScores[dim as Dimension] = Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        )
      }
    })
    
    // 计算总分（每个维度满分100，平均）
    const dimensions = Object.keys(dimensionScores) as Dimension[]
    const totalScore = Math.round(
      dimensions.reduce((sum, dim) => sum + dimensionScores[dim], 0) / dimensions.length
    )
    
    // 更新测评记录
    const duration = assessment.startedAt 
      ? Math.floor((Date.now() - assessment.startedAt.getTime()) / 1000)
      : 0
    
    await prisma.assessment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        duration,
        totalScore,
        dimensionScores: JSON.stringify(dimensionScores)
      }
    })
    
    res.json({
      success: true,
      data: {
        totalScore,
        dimensionScores: dimensions.map(dim => ({
          dimension: dim,
          name: dim,
          score: dimensionScores[dim],
          maxScore: 100
        }))
      }
    })
  } catch (error) {
    next(error)
  }
})

// 获取测评结果
router.get('/:id/result', async (req, res, next) => {
  try {
    const { id } = req.params
    
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        user: true
      }
    })
    
    if (!assessment || assessment.status !== 'COMPLETED') {
      return res.status(404).json({
        success: false,
        error: '测评未完成或不存在'
      })
    }
    
    const dimensionScores = assessment.dimensionScores 
      ? JSON.parse(assessment.dimensionScores as string) 
      : {}
    
    // 计算评级
    const totalScore = assessment.totalScore || 0
    let rating: string
    if (totalScore >= 90) rating = 'excellent'
    else if (totalScore >= 80) rating = 'good'
    else if (totalScore >= 70) rating = 'average'
    else rating = 'needs_improvement'
    
    // 找出优势和不足（前3和后3）
    const sortedDimensions = Object.entries(dimensionScores)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
    
    const strengths = sortedDimensions.slice(0, 3).map(([dim]) => dim)
    const weaknesses = sortedDimensions.slice(-3).map(([dim]) => dim)
    
    res.json({
      success: true,
      data: {
        id: assessment.id,
        totalScore,
        dimensionScores: Object.entries(dimensionScores).map(([dim, score]) => ({
          dimension: dim,
          name: dim,
          score,
          maxScore: 100
        })),
        rating,
        strengths,
        weaknesses,
        user: assessment.user
      }
    })
  } catch (error) {
    next(error)
  }
})

export { router as assessmentRouter }
