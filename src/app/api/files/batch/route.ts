import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createCosInstance, deleteMultipleFiles } from '@/lib/cos'

// 批量删除文件
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const { fileIds } = await request.json()
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: '请提供要删除的文件ID列表' }, { status: 400 })
    }
    
    // 查找所有文件记录
    const files = await prisma.file.findMany({
      where: {
        id: {
          in: fileIds
        }
      },
      include: {
        bucket: true
      }
    })
    
    if (files.length === 0) {
      return NextResponse.json({ error: '未找到任何文件' }, { status: 404 })
    }
    
    // 按存储桶分组文件
    const filesByBucket = files.reduce((acc, file) => {
      const bucketId = file.bucket.id
      if (!acc[bucketId]) {
        acc[bucketId] = {
          bucket: file.bucket,
          files: []
        }
      }
      acc[bucketId].files.push(file)
      return acc
    }, {} as Record<string, { bucket: typeof files[0]['bucket'], files: typeof files }>)
    
    const results = []
    const errors = []
    
    // 按存储桶批量删除文件
    for (const [bucketId, { bucket, files: bucketFiles }] of Object.entries(filesByBucket)) {
      try {
        // 创建COS实例
        const cos = createCosInstance({
          secretId: bucket.secretId,
          secretKey: bucket.secretKey,
          region: bucket.region,
          bucket: bucket.name,
          customDomain: bucket.customDomain || undefined
        })
        
        // 准备要删除的文件keys
        const keysToDelete = bucketFiles.map(file => file.key)
        const thumbnailKeys = bucketFiles
          .filter(file => file.thumbnailUrl)
          .map(file => `thumbnails/${file.key.replace(/\.[^/.]+$/, '')}_thumb.jpg`)
        
        // 删除原文件
        await deleteMultipleFiles(cos, bucket.name, bucket.region, keysToDelete)
        
        // 尝试删除缩略图（如果有）
        if (thumbnailKeys.length > 0) {
          try {
            await deleteMultipleFiles(cos, bucket.name, bucket.region, thumbnailKeys)
          } catch (error) {
            console.error('Failed to delete thumbnails:', error)
            // 忽略缩略图删除失败
          }
        }
        
        // 从数据库删除记录
        const fileIdsToDelete = bucketFiles.map(file => file.id)
        await prisma.file.deleteMany({
          where: {
            id: {
              in: fileIdsToDelete
            }
          }
        })
        
        results.push({
          bucketId,
          deletedCount: fileIdsToDelete.length,
          deletedFiles: bucketFiles.map(f => ({ id: f.id, name: f.name }))
        })
      } catch (error) {
        console.error(`Failed to delete files from bucket ${bucketId}:`, error)
        errors.push({
          bucketId,
          error: error instanceof Error ? error.message : '删除失败',
          files: bucketFiles.map(f => ({ id: f.id, name: f.name }))
        })
      }
    }
    
    // 计算总体结果
    const totalRequested = fileIds.length
    const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0)
    const totalFailed = files.length - totalDeleted
    
    return NextResponse.json({
      success: totalFailed === 0,
      message: `成功删除 ${totalDeleted} 个文件${totalFailed > 0 ? `，${totalFailed} 个失败` : ''}`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        requested: totalRequested,
        deleted: totalDeleted,
        failed: totalFailed
      }
    })
  } catch (error) {
    console.error('Batch delete failed:', error)
    return NextResponse.json({ 
      error: '批量删除失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 