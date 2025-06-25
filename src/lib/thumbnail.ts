import sharp from 'sharp'
import { createCosInstance, uploadFile, getFileUrl } from './cos'
import { CosConfig } from '@/types'
import { shouldGenerateThumbnail, isImageFile, isVideoFile } from './utils'

const THUMBNAIL_WIDTH = 300
const THUMBNAIL_HEIGHT = 300
const THUMBNAIL_QUALITY = 80

// 支持的图片格式（可以使用COS图片处理的格式）
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

// 生成并返回缩略图URL（使用COS的实时图片处理）
export function generateThumbnailUrl(
  bucket: string,
  region: string,
  key: string,
  customDomain?: string,
  mimeType?: string
): string | null {
  const filename = key.split('/').pop() || key
  
  // 检查是否需要生成缩略图
  if (!shouldGenerateThumbnail(filename)) {
    return null
  }
  
  const baseUrl = getFileUrl(bucket, region, key, customDomain)
  
  // 对于图片，使用COS的图片处理功能生成缩略图
  if (isImageFile(filename) && mimeType && SUPPORTED_IMAGE_FORMATS.includes(mimeType)) {
    // 使用COS的图片处理功能生成缩略图
    // 参考：https://cloud.tencent.com/document/product/436/54050
    return `${baseUrl}?imageMogr2/thumbnail/${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}/quality/${THUMBNAIL_QUALITY}`
  }
  
  // 对于视频，使用COS的视频截帧功能
  if (isVideoFile(filename)) {
    // 使用COS的视频截帧功能
    // 参考：https://cloud.tencent.com/document/product/436/55671
    return `${baseUrl}?ci-process=snapshot&time=1&width=${THUMBNAIL_WIDTH}&height=${THUMBNAIL_HEIGHT}&format=jpg`
  }
  
  return null
}

// 为了向后兼容，保留原有的函数签名，但不再生成和上传缩略图
export async function generateAndUploadThumbnail(
  cosConfig: { bucket: string; region: string; customDomain?: string },
  originalKey: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string | null> {
  // 直接返回使用COS图片处理的URL
  return generateThumbnailUrl(
    cosConfig.bucket,
    cosConfig.region,
    originalKey,
    cosConfig.customDomain,
    mimeType
  )
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
  
  // 动态生成缩略图URL
  return generateThumbnailUrl(bucket, region, key, customDomain, mimeType)
} 