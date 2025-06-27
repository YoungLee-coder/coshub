import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt } from '@/lib/utils'
import { BucketFormData } from '@/types'
import { createCosInstance } from '@/lib/cos'

// 获取存储桶列表
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const searchParams = request.nextUrl.searchParams
    const includeStats = searchParams.get('includeStats') === 'true'
    
    const buckets = await prisma.bucket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { files: true }
        }
      }
    })
    
    // 构建响应数据
    const bucketsWithStats = await Promise.all(buckets.map(async (bucket) => {
      let fileCount = bucket._count.files
      let totalSize = 0
      
      // 只有在需要详细统计时才查询COS
      if (includeStats) {
        try {
          // 创建COS实例
          const cos = createCosInstance({
            secretId: bucket.secretId,
            secretKey: bucket.secretKey,
            region: bucket.region,
            bucket: bucket.name,
            customDomain: bucket.customDomain || undefined
          })
          
          // 获取存储桶中的所有文件统计
          let marker = ''
          let isTruncated = true
          let cosFileCount = 0
          let cosTotalSize = 0
          
          while (isTruncated) {
            const result = await new Promise<any>((resolve, reject) => {
              cos.getBucket({
                Bucket: bucket.name,
                Region: bucket.region,
                Marker: marker,
                MaxKeys: 1000,
              }, (err, data) => {
                if (err) {
                  reject(err)
                  return
                }
                resolve(data)
              })
            })
            
            const files = (result.Contents || []).filter((item: any) => !item.Key.endsWith('/'))
            cosFileCount += files.length
            cosTotalSize += files.reduce((sum: number, file: any) => sum + parseInt(file.Size || 0), 0)
            
            isTruncated = result.IsTruncated === 'true' || result.IsTruncated === true
            marker = result.NextMarker || ''
            
            if (!isTruncated) break
          }
          
          fileCount = cosFileCount
          totalSize = cosTotalSize
        } catch (error) {
          console.error(`Failed to get stats for bucket ${bucket.name}:`, error)
          // 如果获取失败，使用数据库中的值
        }
      }
      
      return {
        ...bucket,
        secretKey: undefined, // 不返回密钥
        fileCount,
        totalSize
      }
    }))
    
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