import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt } from '@/lib/utils'
import { BucketFormData } from '@/types'

// 更新存储桶
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const body: BucketFormData = await request.json()
    const { id } = await params
    
    // 检查存储桶是否存在
    const bucket = await prisma.bucket.findUnique({
      where: { id }
    })
    
    if (!bucket) {
      return NextResponse.json({ error: '存储桶不存在' }, { status: 404 })
    }
    
    // 构建更新数据
    const updateData: Record<string, unknown> = {}
    
    if (body.customDomain !== undefined) {
      updateData.customDomain = body.customDomain || null
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description || null
    }
    
    if (body.isDefault !== undefined) {
      // 如果设置为默认，取消其他默认
      if (body.isDefault) {
        await prisma.bucket.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false }
        })
      }
      updateData.isDefault = body.isDefault
    }
    
    // 如果提供了密钥，更新密钥
    if (body.secretId && body.secretKey) {
      updateData.secretId = body.secretId
      updateData.secretKey = encrypt(body.secretKey)
    }
    
    // 更新存储桶
    const updatedBucket = await prisma.bucket.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        region: true,
        customDomain: true,
        description: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json(updatedBucket)
  } catch (error) {
    console.error('Failed to update bucket:', error)
    return NextResponse.json({ error: '更新存储桶失败' }, { status: 500 })
  }
}

// 删除存储桶
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const { id } = await params
    
    // 检查存储桶是否存在
    const bucket = await prisma.bucket.findUnique({
      where: { id },
      include: {
        _count: {
          select: { files: true }
        }
      }
    })
    
    if (!bucket) {
      return NextResponse.json({ error: '存储桶不存在' }, { status: 404 })
    }
    
    // 检查是否有文件
    if (bucket._count.files > 0) {
      return NextResponse.json({ 
        error: '存储桶中还有文件，请先删除所有文件' 
      }, { status: 400 })
    }
    
    // 删除存储桶
    await prisma.bucket.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete bucket:', error)
    return NextResponse.json({ error: '删除存储桶失败' }, { status: 500 })
  }
} 