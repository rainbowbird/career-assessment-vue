import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@career-assessment/database'
import { authenticate } from '../middleware/auth'

const router = Router()

// 获取公开题目列表（不含分值等敏感信息）
router.get('/', async (req, res, next) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        options: {
          select: {
            id: true,
            order: true,
            content: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })
    
    res.json({
      success: true,
      data: questions
    })
  } catch (error) {
    next(error)
  }
})

export { router as questionRouter }
