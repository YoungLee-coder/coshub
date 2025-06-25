import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, prisma } from '@/lib/db'
import { createInitialUser } from '@/lib/auth'
import { InitializeFormData } from '@/types'
import { writeFileSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

export async function GET() {
  try {
    const status = await initializeDatabase()
    
    // 检查是否存在必要的环境变量
    const hasEnvConfig = !!(
      process.env.NEXTAUTH_URL &&
      process.env.NEXTAUTH_SECRET &&
      process.env.ENCRYPTION_KEY
    )
    
    return NextResponse.json({ 
      ...status,
      hasEnvConfig 
    })
  } catch (error) {
    return NextResponse.json(
      { error: '检查初始化状态失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: InitializeFormData = await request.json()
    
    // 验证输入
    if (!body.username || !body.password || !body.confirmPassword) {
      return NextResponse.json(
        { error: '请填写所有字段' },
        { status: 400 }
      )
    }
    
    if (body.password !== body.confirmPassword) {
      return NextResponse.json(
        { error: '两次输入的密码不一致' },
        { status: 400 }
      )
    }
    
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为6位' },
        { status: 400 }
      )
    }
    
    // 检查是否已初始化
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return NextResponse.json(
        { error: '系统已初始化' },
        { status: 400 }
      )
    }
    
    // 如果没有环境变量，生成.env.local文件
    if (!process.env.NEXTAUTH_SECRET || !process.env.ENCRYPTION_KEY) {
      try {
        const envContent = `# NextAuth配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${crypto.randomBytes(32).toString('base64')}

# 数据库配置
DATABASE_URL="file:./prisma/dev.db"

# 加密密钥（用于加密存储桶密钥）
ENCRYPTION_KEY=${crypto.randomBytes(32).toString('base64')}
`
        
        const envPath = join(process.cwd(), '.env.local')
        writeFileSync(envPath, envContent, 'utf8')
        
        return NextResponse.json({ 
          success: false,
          needRestart: true,
          message: '环境配置文件已创建，请重启服务器以应用配置' 
        })
      } catch (error) {
        console.error('Failed to create .env.local:', error)
        return NextResponse.json(
          { error: '创建环境配置文件失败' },
          { status: 500 }
        )
      }
    }
    
    // 创建初始用户
    await createInitialUser(body.username, body.password)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Initialize error:', error)
    return NextResponse.json(
      { error: '初始化失败' },
      { status: 500 }
    )
  }
} 