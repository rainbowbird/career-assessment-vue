import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

export interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

/**
 * 创建邮件传输器
 */
export function createTransporter(config: SMTPConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  })
}

/**
 * 测试 SMTP 连接
 */
export async function testSMTPConnection(config: SMTPConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter(config)
    await transporter.verify()
    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'SMTP 连接失败' 
    }
  }
}

/**
 * 发送邮件
 */
export async function sendEmail(
  config: SMTPConfig,
  options: {
    to: string
    subject: string
    body: string
    attachments?: Array<{
      filename: string
      content: Buffer
      contentType?: string
    }>
  }
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const transporter = createTransporter(config)
    
    const result = await transporter.sendMail({
      from: config.user,
      to: options.to,
      subject: options.subject,
      html: options.body,
      attachments: options.attachments
    })
    
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '邮件发送失败'
    }
  }
}
