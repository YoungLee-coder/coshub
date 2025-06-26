import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/utils'
import { BucketFormData } from '@/types'
import { createCosInstance } from '@/lib/cos'

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
        try {
          // 创建COS实例
          const cos = createCosInstance({
            secretId: bucket.secretId,
            secretKey: decrypt(bucket.secretKey),
            region: bucket.region,
            bucket: bucket.name,
            customDomain: bucket.customDomain || undefined
          })
          
          // 从COS获取文件统计信息
          let fileCount = 0
          let totalSize = 0
          let marker = ''
          let isTruncated = true
          
          // 循环获取所有文件（处理分页）
          while (isTruncated) {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = await new Promise<any>((resolve, reject) => {
              cos.getBucket({
                Bucket: bucket.name,
                Region: bucket.region,
                Marker: marker,
                MaxKeys: 1000,
              }, (err, data) => {
                if (err) {
                  console.error(`Failed to get bucket stats for ${bucket.name}:`, err)
                  reject(err)
                  return
                }
                resolve(data)
              })
            })
            
            // 统计文件数量和大小（排除文件夹）
            if (result.Contents) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              result.Contents.forEach((item: any) => {
                // 排除文件夹（以/结尾）
                if (!item.Key.endsWith('/')) {
                  fileCount++
                  totalSize += parseInt(item.Size || '0')
                }
              })
            }
            
            marker = result.NextMarker || ''
            isTruncated = result.IsTruncated || false
          }
          
          return {
            ...bucket,
            secretKey: undefined, // 不返回密钥
            fileCount,
            totalSize
          } as Omit<typeof bucket, 'secretKey'> & { fileCount: number; totalSize: number }
        } catch (error) {
          console.error(`Failed to get stats for bucket ${bucket.name}:`, error)
          // 如果获取失败，返回默认值
          return {
            ...bucket,
            secretKey: undefined,
            fileCount: 0,
            totalSize: 0
          } as Omit<typeof bucket, 'secretKey'> & { fileCount: number; totalSize: number }
        }
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