import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt } from '@/lib/utils'
import { BucketFormData } from '@/types'

// 获取存储桶列表
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const buckets = await prisma.bucket.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // 构建响应数据，包含统计信息
    const bucketsWithStats = await Promise.all(
      buckets.map(async (bucket) => {
        const fileCount = await prisma.file.count({
          where: { bucketId: bucket.id }
        })
        
        const totalSize = await prisma.file.aggregate({
          where: { bucketId: bucket.id },
          _sum: { size: true }
        })
        
        return {
          ...bucket,
          secretKey: undefined, // 不返回密钥
          fileCount,
          totalSize: totalSize._sum.size || 0
        } as Omit<typeof bucket, 'secretKey'> & { fileCount: number; totalSize: number }
      })
    )
    
    return NextResponse.json(bucketsWithStats)
  } catch (error) {
    console.error('Failed to fetch buckets:', error)
    return NextResponse.json({ error: '获取存储桶列表失败' }, { status: 500 })
  }
}

// 创建存储桶
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const body: BucketFormData = await request.json()
    
    // 验证必填字段
    if (!body.name || !body.region || !body.secretId || !body.secretKey) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 })
    }
    
    // 检查名称是否已存在
    const existing = await prisma.bucket.findUnique({
      where: { name: body.name }
    })
    
    if (existing) {
      return NextResponse.json({ error: '存储桶名称已存在' }, { status: 400 })
    }
    
    // 如果设置为默认，取消其他默认
    if (body.isDefault) {
      await prisma.bucket.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }
    
    // 创建存储桶
    const bucket = await prisma.bucket.create({
      data: {
        name: body.name,
        region: body.region,
        secretId: body.secretId,
        secretKey: encrypt(body.secretKey), // 加密存储
        customDomain: body.customDomain,
        description: body.description,
        isDefault: body.isDefault || false
      }
    })
    
    return NextResponse.json(bucket)
  } catch (error) {
    console.error('Failed to create bucket:', error)
    return NextResponse.json({ error: '创建存储桶失败' }, { status: 500 })
  }
} 