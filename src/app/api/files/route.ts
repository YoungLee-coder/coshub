import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createCosInstance, listFiles, uploadFile, getFileUrl } from '@/lib/cos'
import { generateAndUploadThumbnail } from '@/lib/thumbnail'

// 获取文件列表
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const searchParams = request.nextUrl.searchParams
    const bucketId = searchParams.get('bucketId')
    const prefix = searchParams.get('prefix') || ''
    
    if (!bucketId) {
      return NextResponse.json({ error: '请提供bucketId' }, { status: 400 })
    }
    
    // 获取存储桶信息
    const bucket = await prisma.bucket.findUnique({
      where: { id: bucketId }
    })
    
    if (!bucket) {
      return NextResponse.json({ error: '存储桶不存在' }, { status: 404 })
    }
    
    // 创建COS实例
    const cos = createCosInstance({
      secretId: bucket.secretId,
      secretKey: bucket.secretKey,
      region: bucket.region,
      bucket: bucket.name,
      customDomain: bucket.customDomain || undefined
    })
    
    // 获取COS文件列表
    const cosFiles = await listFiles(cos, bucket.name, bucket.region, prefix)
    
    // 获取数据库中的文件记录
    const dbFiles = await prisma.file.findMany({
      where: {
        bucketId: bucketId,
        key: {
          startsWith: prefix
        }
      }
    })
    
    // 创建文件映射
    const dbFileMap = new Map(dbFiles.map(file => [file.key, file]))
    
    // 合并COS文件和数据库记录
    const files = cosFiles.map(cosFile => {
      const dbFile = dbFileMap.get(cosFile.key)
      return {
        id: dbFile?.id || null,
        key: cosFile.key,
        name: cosFile.name,
        size: cosFile.size,
        type: dbFile?.type || 'application/octet-stream',
        lastModified: cosFile.lastModified,
        url: getFileUrl(bucket.name, bucket.region, cosFile.key, bucket.customDomain || undefined),
        thumbnailUrl: dbFile?.thumbnailUrl || null,
        bucketId: bucketId
      }
    })
    
    return NextResponse.json(files)
  } catch (error) {
    console.error('Failed to list files:', error)
    return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 })
  }
}

// 上传文件
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucketId = formData.get('bucketId') as string
    const prefix = formData.get('prefix') as string || ''
    
    if (!file || !bucketId) {
      return NextResponse.json({ error: '请提供文件和bucketId' }, { status: 400 })
    }
    
    // 获取存储桶信息
    const bucket = await prisma.bucket.findUnique({
      where: { id: bucketId }
    })
    
    if (!bucket) {
      return NextResponse.json({ error: '存储桶不存在' }, { status: 404 })
    }
    
    // 创建COS实例
    const cos = createCosInstance({
      secretId: bucket.secretId,
      secretKey: bucket.secretKey,
      region: bucket.region,
      bucket: bucket.name,
      customDomain: bucket.customDomain || undefined
    })
    
    // 生成文件key
    const timestamp = Date.now()
    const filename = file.name
    const key = prefix ? `${prefix}/${timestamp}-${filename}` : `${timestamp}-${filename}`
    
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 上传文件到COS
    const uploadResult = await uploadFile(
      cos,
      bucket.name,
      bucket.region,
      key,
      buffer
    )
    
    // 生成缩略图
    let thumbnailUrl = null
    try {
      thumbnailUrl = await generateAndUploadThumbnail(
        {
          secretId: bucket.secretId,
          secretKey: bucket.secretKey,
          region: bucket.region,
          bucket: bucket.name,
          customDomain: bucket.customDomain || undefined
        },
        key,
        buffer,
        file.type
      )
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
    }
    
    // 保存文件记录到数据库
    const dbFile = await prisma.file.create({
      data: {
        key,
        name: filename,
        size: file.size,
        type: file.type,
        bucketId,
        thumbnailUrl,
        metadata: JSON.stringify({
          uploadedBy: session.user.id,
          originalName: file.name
        })
      }
    })
    
    const fileUrl = getFileUrl(bucket.name, bucket.region, key, bucket.customDomain || undefined)
    
    return NextResponse.json({
      id: dbFile.id,
      key: dbFile.key,
      name: dbFile.name,
      size: dbFile.size,
      type: dbFile.type,
      url: fileUrl,
      thumbnailUrl: dbFile.thumbnailUrl,
      bucketId: dbFile.bucketId,
      uploadedAt: dbFile.uploadedAt
    })
  } catch (error) {
    console.error('Failed to upload file:', error)
    return NextResponse.json({ error: '上传文件失败' }, { status: 500 })
  }
} 