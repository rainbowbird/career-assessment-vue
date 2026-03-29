import { Router } from 'express'
import { prisma } from '@career-assessment/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const loginSchema = z.object({
  password: z.string().min(1, '密码不能为空')
})

// 登录
router.post('/login', async (req, res, next) => {
  try {
    const { password } = loginSchema.parse(req.body)
    
    const admin = await prisma.admin.findFirst()
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: '管理员账号不存在'
      })
    }
    
    const isValid = await bcrypt.compare(password, admin.password)
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '密码错误'
      })
    }
    
    const token = jwt.sign(
      { adminId: admin.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    res.json({
      success: true,
      data: { token }
    })
  } catch (error) {
    next(error)
  }
})

export { router as authRouter }
