import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, prisma } from '@/lib/db'
import { createInitialUser } from '@/lib/auth'
import { InitializeFormData } from '@/types'

export async function GET() {
  try {
    const status = await initializeDatabase()
    return NextResponse.json(status)
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