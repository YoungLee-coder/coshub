import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createCosInstance, uploadFile, getFileUrl } from '@/lib/cos'
import { generateAndUploadThumbnail, getThumbnailUrl } from '@/lib/thumbnail'

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
    const marker = searchParams.get('marker') || ''
    const maxKeys = parseInt(searchParams.get('maxKeys') || '1000')
    const sortField = searchParams.get('sortField') || 'uploadedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    if (!bucketId) {
      return NextResponse.json({ error: '请提供bucketId' }, { status: 400 })
    }
    
    // 获取存储桶信息
    const bucket = await prisma.bucket.findUnique({
      where: { id: bucketId },
      include: {
        _count: {
          select: { files: true }
        }
      }
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
    
    // 如果需要获取总文件数或进行排序，先获取所有文件
    let totalFileCount = 0
    let allCosFiles: any[] = []
    
    if (sortField !== 'name' || marker === '') {
      // 获取所有文件用于统计和排序
      let tempMarker = ''
      let isTruncated = true
      
      while (isTruncated) {
        const tempResult = await new Promise<any>((resolve, reject) => {
          cos.getBucket({
            Bucket: bucket.name,
            Region: bucket.region,
            Prefix: prefix,
            Marker: tempMarker,
            MaxKeys: 1000,
            Delimiter: '/',
          }, (err, data) => {
            if (err) {
              reject(err)
              return
            }
            resolve(data)
          })
        })
        
        const tempFiles = (tempResult.Contents || []).filter((item: any) => !item.Key.endsWith('/'))
        allCosFiles = allCosFiles.concat(tempFiles)
        
        isTruncated = tempResult.IsTruncated === 'true' || tempResult.IsTruncated === true
        tempMarker = tempResult.NextMarker || ''
        
        if (!isTruncated) break
      }
      
      totalFileCount = allCosFiles.length
    }
    
    // 获取当前页的文件列表
    let cosResult: any
    let cosFiles: any[]
    
    if (sortField === 'name' && marker !== '') {
      // 如果是按名称排序且不是第一页，使用普通分页
      cosResult = await new Promise<any>((resolve, reject) => {
        cos.getBucket({
          Bucket: bucket.name,
          Region: bucket.region,
          Prefix: prefix,
          Marker: marker,
          MaxKeys: maxKeys,
          Delimiter: '/',
        }, (err, data) => {
          if (err) {
            reject(err)
            return
          }
          resolve(data)
        })
      })
      
      cosFiles = (cosResult.Contents || []).map((item: any) => ({
        key: item.Key,
        name: item.Key.split('/').pop() || item.Key,
        size: parseInt(item.Size),
        lastModified: new Date(item.LastModified),
        eTag: item.ETag,
        storageClass: item.StorageClass,
      }))
    } else {
      // 需要排序的情况，从已获取的所有文件中处理
      if (sortField === 'uploadedAt' || sortField === 'size') {
        // 排序所有文件
        allCosFiles.sort((a, b) => {
          if (sortField === 'uploadedAt') {
            const dateA = new Date(a.LastModified).getTime()
            const dateB = new Date(b.LastModified).getTime()
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
          } else if (sortField === 'size') {
            const sizeA = parseInt(a.Size)
            const sizeB = parseInt(b.Size)
            return sortOrder === 'desc' ? sizeB - sizeA : sizeA - sizeB
          }
          return 0
        })
        
        // 计算当前页的起始位置
        const pageIndex = marker ? allCosFiles.findIndex(f => f.Key === marker) + 1 : 0
        const pageFiles = allCosFiles.slice(pageIndex, pageIndex + maxKeys)
        
        cosFiles = pageFiles.map((item: any) => ({
          key: item.Key,
          name: item.Key.split('/').pop() || item.Key,
          size: parseInt(item.Size),
          lastModified: new Date(item.LastModified),
          eTag: item.ETag,
          storageClass: item.StorageClass,
        }))
        
        // 构造分页信息
        cosResult = {
          IsTruncated: pageIndex + maxKeys < allCosFiles.length,
          NextMarker: pageIndex + maxKeys < allCosFiles.length ? allCosFiles[pageIndex + maxKeys - 1].Key : null,
          Contents: pageFiles,
          CommonPrefixes: []
        }
      } else {
        // 按名称排序，第一页
        cosResult = await new Promise<any>((resolve, reject) => {
          cos.getBucket({
            Bucket: bucket.name,
            Region: bucket.region,
            Prefix: prefix,
            Marker: marker,
            MaxKeys: maxKeys,
            Delimiter: '/',
          }, (err, data) => {
            if (err) {
              reject(err)
              return
            }
            resolve(data)
          })
        })
        
        cosFiles = (cosResult.Contents || []).map((item: any) => ({
          key: item.Key,
          name: item.Key.split('/').pop() || item.Key,
          size: parseInt(item.Size),
          lastModified: new Date(item.LastModified),
          eTag: item.ETag,
          storageClass: item.StorageClass,
        }))
      }
    }
    
    // 处理文件夹（CommonPrefixes）
    const cosFolders = (cosResult.CommonPrefixes || []).map((item: any) => ({
      key: item.Prefix,
      name: item.Prefix.split('/').filter(Boolean).pop() || item.Prefix,
      size: 0,
      lastModified: new Date(),
      isFolder: true
    }))
    
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
    
    // 合并所有项目（文件和文件夹）
    const allItems = [...cosFolders, ...cosFiles]
    
    // 处理所有项目
    const files = allItems.map((item: any) => {
      // 如果是文件夹
      if (item.isFolder) {
        return {
          id: null,
          key: item.key,
          name: item.name,
          size: 0,
          type: 'folder',
          lastModified: item.lastModified,
          uploadedAt: item.lastModified,
          url: getFileUrl(bucket.name, bucket.region, item.key, bucket.customDomain || undefined),
          thumbnailUrl: null,
          bucketId: bucketId,
          isFolder: true
        }
      }
      
      // 如果是文件
      const dbFile = dbFileMap.get(item.key)
      const fileUrl = getFileUrl(bucket.name, bucket.region, item.key, bucket.customDomain || undefined)
      
      // 动态生成缩略图URL
      const thumbnailUrl = getThumbnailUrl(
        bucket.name,
        bucket.region,
        item.key,
        bucket.customDomain || undefined,
        dbFile?.thumbnailUrl,
        dbFile?.type
      )
      
      return {
        id: dbFile?.id || null,
        key: item.key,
        name: item.name,
        size: item.size,
        type: dbFile?.type || 'application/octet-stream',
        lastModified: item.lastModified,
        uploadedAt: dbFile?.uploadedAt || item.lastModified,
        url: fileUrl,
        thumbnailUrl: thumbnailUrl,
        bucketId: bucketId
      }
    })
    
    // 判断是否有更多数据
    // COS 的 IsTruncated 表示是否还有更多数据
    const isTruncated = cosResult.IsTruncated === 'true' || cosResult.IsTruncated === true
    
    // 返回分页信息
    return NextResponse.json({
      files,
      nextMarker: isTruncated ? cosResult.NextMarker : null,
      isTruncated: isTruncated,
      total: totalFileCount > 0 ? totalFileCount : bucket?._count.files || 0
    })
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
    const customKey = formData.get('key') as string || '' // 支持自定义key
    
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
    let key: string
    if (customKey) {
      // 使用自定义key（例如创建文件夹）
      key = customKey
    } else {
      // 保持原始文件名，只添加前缀路径
      const filename = file.name
      key = prefix ? `${prefix}${filename}` : filename
    }
    
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 上传文件到COS
    await uploadFile(
      cos,
      bucket.name,
      bucket.region,
      key,
      buffer
    )
    
    // 如果是文件夹（以/结尾），不需要生成缩略图和保存到数据库
    if (key.endsWith('/')) {
      return NextResponse.json({
        key,
        name: key.split('/').filter(Boolean).pop() || key,
        type: 'folder',
        url: getFileUrl(bucket.name, bucket.region, key, bucket.customDomain || undefined),
        bucketId
      })
    }
    
    // 生成缩略图
    let thumbnailUrl = null
    try {
      thumbnailUrl = await generateAndUploadThumbnail(
        {
          bucket: bucket.name,
          region: bucket.region,
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
    const filename = key.split('/').pop() || key
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