import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createCosInstance, deleteFile as deleteCosFile, renameFile } from '@/lib/cos'

// 删除文件
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
    
    // 查找文件记录
    const file = await prisma.file.findUnique({
      where: { id },
      include: { bucket: true }
    })
    
    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }
    
    // 创建COS实例
    const cos = createCosInstance({
      secretId: file.bucket.secretId,
      secretKey: file.bucket.secretKey,
      region: file.bucket.region,
      bucket: file.bucket.name,
      customDomain: file.bucket.customDomain || undefined
    })
    
    // 从COS删除文件
    await deleteCosFile(cos, file.bucket.name, file.bucket.region, file.key)
    
    // 如果有缩略图，也尝试删除（缩略图key基于原始文件key）
    if (file.thumbnailUrl) {
      const thumbnailKey = `thumbnails/${file.key.replace(/\.[^/.]+$/, '')}_thumb.jpg`
      try {
        await deleteCosFile(cos, file.bucket.name, file.bucket.region, thumbnailKey)
      } catch (error) {
        console.error('Failed to delete thumbnail:', error)
        // 忽略缩略图删除失败
      }
    }
    
    // 从数据库删除记录
    await prisma.file.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete file:', error)
    return NextResponse.json({ error: '删除文件失败' }, { status: 500 })
  }
}

// 重命名文件
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const { id } = await params
    const { newName } = await request.json()
    
    if (!newName || !newName.trim()) {
      return NextResponse.json({ error: '请提供新文件名' }, { status: 400 })
    }
    
    // 查找文件记录
    const file = await prisma.file.findUnique({
      where: { id },
      include: { bucket: true }
    })
    
    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }
    
    // 构建新的 key（保持原有路径，只改变文件名）
    const oldKeyParts = file.key.split('/')
    oldKeyParts.pop() // 移除旧文件名
    const newKey = oldKeyParts.length > 0 
      ? `${oldKeyParts.join('/')}/${newName}` 
      : newName
    
    // 检查新文件名是否已存在
    const existingFile = await prisma.file.findFirst({
      where: {
        bucketId: file.bucketId,
        key: newKey
      }
    })
    
    if (existingFile) {
      return NextResponse.json({ error: '目标文件名已存在' }, { status: 400 })
    }
    
    // 创建COS实例
    const cos = createCosInstance({
      secretId: file.bucket.secretId,
      secretKey: file.bucket.secretKey,
      region: file.bucket.region,
      bucket: file.bucket.name,
      customDomain: file.bucket.customDomain || undefined
    })
    
    // 在 COS 中重命名文件
    await renameFile(cos, file.bucket.name, file.bucket.region, file.key, newKey)
    
    // 如果有缩略图，也需要重命名（缩略图路径基于原始文件路径）
    if (file.thumbnailUrl) {
      const oldThumbKey = `thumbnails/${file.key.replace(/\.[^/.]+$/, '')}_thumb.jpg`
      const newThumbKey = `thumbnails/${newKey.replace(/\.[^/.]+$/, '')}_thumb.jpg`
      try {
        await renameFile(cos, file.bucket.name, file.bucket.region, oldThumbKey, newThumbKey)
      } catch (error) {
        console.error('Failed to rename thumbnail:', error)
        // 忽略缩略图重命名失败
      }
    }
    
    // 更新数据库记录
    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        key: newKey,
        name: newName
      }
    })
    
    return NextResponse.json({
      success: true,
      file: updatedFile
    })
  } catch (error) {
    console.error('Failed to rename file:', error)
    return NextResponse.json({ error: '重命名失败' }, { status: 500 })
  }
} 