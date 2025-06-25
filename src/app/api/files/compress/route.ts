import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createCosInstance, getSignedUrl } from '@/lib/cos'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  
  try {
    const { bucketId, fileKeys } = await request.json()
    
    if (!bucketId || !fileKeys || !Array.isArray(fileKeys) || fileKeys.length === 0) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
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
    
    // 创建ZIP文件
    const zip = new JSZip()
    
    // 下载并添加文件到ZIP
    for (const key of fileKeys) {
      try {
        // 获取文件签名URL
        const signedUrl = await getSignedUrl(cos, bucket.name, bucket.region, key)
        
        // 下载文件内容
        const response = await fetch(signedUrl)
        if (!response.ok) {
          console.error(`Failed to fetch file ${key}`)
          continue
        }
        
        const buffer = await response.arrayBuffer()
        const filename = key.split('/').pop() || key
        
        // 添加文件到ZIP
        zip.file(filename, buffer)
      } catch (error) {
        console.error(`Error processing file ${key}:`, error)
      }
    }
    
    // 生成ZIP文件
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    // 返回ZIP文件
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="files-${Date.now()}.zip"`
      }
    })
  } catch (error) {
    console.error('Failed to compress files:', error)
    return NextResponse.json({ error: '压缩文件失败' }, { status: 500 })
  }
} 