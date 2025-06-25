import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createCosInstance, deleteFile as deleteCosFile } from '@/lib/cos'

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