import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

dotenv.config()

import { errorHandler } from './middleware/errorHandler'
import { authRouter } from './routes/auth'
import { assessmentRouter } from './routes/assessment'
import { adminRouter } from './routes/admin'
import { questionRouter } from './routes/question'

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// 路由
app.use('/api/auth', authRouter)
app.use('/api/assessments', assessmentRouter)
app.use('/api/admin', adminRouter)
app.use('/api/questions', questionRouter)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 错误处理
app.use(errorHandler)

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
