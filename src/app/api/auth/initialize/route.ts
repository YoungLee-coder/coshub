import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db'

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
    console.error('Failed to check initialization status:', error)
    return NextResponse.json(
      { error: '检查初始化状态失败' },
      { status: 500 }
    )
  }
} 