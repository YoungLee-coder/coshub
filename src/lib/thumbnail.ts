import sharp from 'sharp'
import { createCosInstance, uploadFile, getFileUrl } from './cos'
import { CosConfig } from '@/types'
import { shouldGenerateThumbnail, isImageFile, isVideoFile } from './utils'

const THUMBNAIL_WIDTH = 300
const THUMBNAIL_HEIGHT = 300

// 生成图片缩略图
export async function generateImageThumbnail(
  imageBuffer: Buffer,
  options?: {
    width?: number
    height?: number
    quality?: number
  }
): Promise<Buffer> {
  const { width = THUMBNAIL_WIDTH, height = THUMBNAIL_HEIGHT, quality = 80 } = options || {}
  
  return sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality })
    .toBuffer()
}

// 为视频生成缩略图（使用COS的数据处理功能）
export function getVideoThumbnailUrl(
  bucket: string,
  region: string,
  key: string,
  customDomain?: string,
  time: number = 1 // 截取第1秒的画面
): string {
  const baseUrl = getFileUrl(bucket, region, key, customDomain)
  // 使用COS的视频截帧功能
  return `${baseUrl}?ci-process=snapshot&time=${time}&width=${THUMBNAIL_WIDTH}&height=${THUMBNAIL_HEIGHT}`
}

// 生成并上传缩略图
export async function generateAndUploadThumbnail(
  cosConfig: CosConfig,
  originalKey: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string | null> {
  try {
    const filename = originalKey.split('/').pop() || originalKey
    
    if (!shouldGenerateThumbnail(filename)) {
      return null
    }
    
    // 生成缩略图key
    const thumbnailKey = `thumbnails/${originalKey.replace(/\.[^/.]+$/, '')}_thumb.jpg`
    
    if (isImageFile(filename)) {
      // 生成图片缩略图
      const thumbnailBuffer = await generateImageThumbnail(fileBuffer)
      
      // 上传缩略图
      const cos = createCosInstance(cosConfig)
      await uploadFile(
        cos,
        cosConfig.bucket,
        cosConfig.region,
        thumbnailKey,
        thumbnailBuffer
      )
      
      return getFileUrl(cosConfig.bucket, cosConfig.region, thumbnailKey, cosConfig.customDomain)
    } else if (isVideoFile(filename)) {
      // 对于视频，返回COS的视频截帧URL
      return getVideoThumbnailUrl(
        cosConfig.bucket,
        cosConfig.region,
        originalKey,
        cosConfig.customDomain
      )
    }
    
    return null
  } catch (error) {
    console.error('Failed to generate thumbnail:', error)
    return null
  }
}

// 获取文件的缩略图URL
export function getThumbnailUrl(
  bucket: string,
  region: string,
  key: string,
  customDomain?: string,
  thumbnailUrl?: string | null
): string | null {
  if (thumbnailUrl) {
    return thumbnailUrl
  }
  
  const filename = key.split('/').pop() || key
  
  if (isVideoFile(filename)) {
    // 对于视频，动态生成缩略图URL
    return getVideoThumbnailUrl(bucket, region, key, customDomain)
  }
  
  return null
} 