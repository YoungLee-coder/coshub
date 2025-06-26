import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }
    
    const { newUsername } = await request.json()
    
    if (!newUsername || !newUsername.trim()) {
      return NextResponse.json(
        { error: '请提供新用户名' },
        { status: 400 }
      )
    }
    
    const trimmedUsername = newUsername.trim()
    
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: '用户名长度至少为3位' },
        { status: 400 }
      )
    }
    
    // 获取当前用户（单用户系统，直接通过 session 获取）
    const currentUser = await prisma.user.findUnique({
      where: { username: session.user.name! }
    })
    
    if (!currentUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }
    
    // 更新用户名
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { username: trimmedUsername }
    })
    
    return NextResponse.json({ 
      success: true,
      username: trimmedUsername
    })
  } catch (error) {
    console.error('Failed to change username:', error)
    return NextResponse.json(
      { error: '修改用户名失败' },
      { status: 500 }
    )
  }
} 