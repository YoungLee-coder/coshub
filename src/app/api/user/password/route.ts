import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
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
    
    const { currentPassword, newPassword } = await request.json()
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '请提供当前密码和新密码' },
        { status: 400 }
      )
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度至少为6位' },
        { status: 400 }
      )
    }
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { username: session.user.name! }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }
    
    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '当前密码错误' },
        { status: 400 }
      )
    }
    
    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to change password:', error)
    return NextResponse.json(
      { error: '修改密码失败' },
      { status: 500 }
    )
  }
} 