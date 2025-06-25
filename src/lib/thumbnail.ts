import sharp from 'sharp'
import { createCosInstance, uploadFile, getFileUrl } from './cos'
import { CosConfig } from '@/types'
import { shouldGenerateThumbnail, isImageFile, isVideoFile } from './utils'

const THUMBNAIL_WIDTH = 300
const THUMBNAIL_HEIGHT = 300
const THUMBNAIL_QUALITY = 80

// 支持的图片格式
const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff'
]

// 生成图片缩略图
export async function generateImageThumbnail(
  imageBuffer: Buffer,
  options?: {
    width?: number
    height?: number
    quality?: number
  }
): Promise<Buffer> {
  const { 
    width = THUMBNAIL_WIDTH, 
    height = THUMBNAIL_HEIGHT, 
    quality = THUMBNAIL_QUALITY 
  } = options || {}
  
  try {
    // 使用 sharp 生成缩略图
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true // 防止小图被放大
      })
      .jpeg({ 
        quality,
        mozjpeg: true // 使用 mozjpeg 编码器获得更好的压缩
      })
      .toBuffer()
      
    return thumbnailBuffer
  } catch (error) {
    console.error('Error generating thumbnail with sharp:', error)
    throw error
  }
}

// 为视频生成缩略图（使用COS的数据处理功能）
export function getVideoThumbnailUrl(
  bucket: string,
  region: string,
  key: string,
  customDomain?: string,
  options?: {
    time?: number // 截取时间（秒）
    width?: number
    height?: number
    format?: 'jpg' | 'png'
  }
): string {
  const { 
    time = 1, 
    width = THUMBNAIL_WIDTH, 
    height = THUMBNAIL_HEIGHT,
    format = 'jpg'
  } = options || {}
  
  const baseUrl = getFileUrl(bucket, region, key, customDomain)
  // 使用COS的视频截帧功能
  // 参考：https://cloud.tencent.com/document/product/436/55671
  return `${baseUrl}?ci-process=snapshot&time=${time}&width=${width}&height=${height}&format=${format}`
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
    
    // 检查是否需要生成缩略图
    if (!shouldGenerateThumbnail(filename)) {
      return null
    }
    
    // 生成缩略图key（保存在专门的缩略图目录）
    const thumbnailKey = `thumbnails/${originalKey.replace(/\.[^/.]+$/, '')}_thumb.jpg`
    
    if (isImageFile(filename) && SUPPORTED_IMAGE_FORMATS.includes(mimeType)) {
      try {
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
        
        return getFileUrl(
          cosConfig.bucket, 
          cosConfig.region, 
          thumbnailKey, 
          cosConfig.customDomain
        )
      } catch (error) {
        console.error('Failed to generate/upload image thumbnail:', error)
        // 如果生成失败，返回原图URL（避免完全失败）
        return getFileUrl(
          cosConfig.bucket,
          cosConfig.region,
          originalKey,
          cosConfig.customDomain
        )
      }
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
  thumbnailUrl?: string | null,
  mimeType?: string
): string | null {
  // 如果已有缩略图URL，直接返回
  if (thumbnailUrl) {
    return thumbnailUrl
  }
  
  const filename = key.split('/').pop() || key
  
  // 对于视频，动态生成缩略图URL
  if (isVideoFile(filename)) {
    return getVideoThumbnailUrl(bucket, region, key, customDomain)
  }
  
  // 对于图片，如果没有生成缩略图，可以使用COS的图片处理功能
  if (isImageFile(filename) && mimeType && SUPPORTED_IMAGE_FORMATS.includes(mimeType)) {
    const baseUrl = getFileUrl(bucket, region, key, customDomain)
    // 使用COS的图片处理功能生成缩略图
    // 参考：https://cloud.tencent.com/document/product/436/54050
    return `${baseUrl}?imageMogr2/thumbnail/${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}/quality/${THUMBNAIL_QUALITY}`
  }
  
  return null
} 