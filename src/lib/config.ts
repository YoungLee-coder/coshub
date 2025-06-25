// 流量控制配置
export const TRAFFIC_CONTROL = {
  // 缩略图配置
  // 使用腾讯云COS的数据处理功能，通过URL参数实时生成缩略图
  // 文档：https://cloud.tencent.com/document/product/436/54050
  thumbnail: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 80,
    // 超过此大小的文件不生成缩略图（字节）
    maxFileSize: 10 * 1024 * 1024, // 10MB
    // 支持的图片格式
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
  },
  
  // 预览配置
  // 在查看图片详情时使用较大尺寸，但仍然限制最大尺寸以节省流量
  preview: {
    // 预览时的最大图片尺寸
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    // 超过此大小的文件不允许预览（字节）
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  
  // 批量操作限制
  batch: {
    // 批量下载的最大文件数
    maxDownloadCount: 20,
    // 批量下载的最大总大小（字节）
    maxDownloadSize: 500 * 1024 * 1024, // 500MB
  },
  
  // 缓存配置
  cache: {
    // 浏览器缓存时间（秒）
    maxAge: 86400, // 24小时
    // 是否启用 Service Worker 缓存
    enableServiceWorker: false,
  }
}

// 获取缩略图 URL 参数
export function getThumbnailParams(type: 'image' | 'video' = 'image') {
  const { maxWidth, maxHeight, quality } = TRAFFIC_CONTROL.thumbnail
  
  if (type === 'image') {
    return `imageMogr2/thumbnail/${maxWidth}x${maxHeight}/quality/${quality}`
  }
  
  return `ci-process=snapshot&time=1&width=${maxWidth}&height=${maxHeight}&format=jpg`
}

// 获取预览图片 URL 参数
export function getPreviewParams() {
  const { maxWidth, maxHeight, quality } = TRAFFIC_CONTROL.preview
  return `imageMogr2/thumbnail/${maxWidth}x${maxHeight}/quality/${quality}`
}

// 检查文件是否可以预览
export function canPreviewFile(fileSize: number, mimeType?: string): boolean {
  // 检查文件大小
  if (fileSize > TRAFFIC_CONTROL.preview.maxFileSize) {
    return false
  }
  
  // 检查文件类型
  if (mimeType) {
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/bmp', 'video/mp4', 'video/webm'
    ]
    return supportedTypes.includes(mimeType)
  }
  
  return true
} 