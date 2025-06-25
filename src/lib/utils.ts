import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 服务器端加密解密函数
let crypto: typeof import('crypto') | undefined

if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  crypto = require('crypto')
}

// 获取加密密钥
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables')
  }
  return key
}

// 加密函数（仅服务器端）
export function encrypt(text: string): string {
  if (!crypto) {
    throw new Error('Crypto operations are only available on the server side')
  }
  
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(getEncryptionKey(), 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

// 解密函数（仅服务器端）
export function decrypt(encryptedData: string): string {
  if (!crypto) {
    throw new Error('Crypto operations are only available on the server side')
  }
  
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }
  
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(getEncryptionKey(), 'salt', 32)
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// 文件相关工具函数
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico']
  const ext = getFileExtension(filename)
  return imageExtensions.includes(ext)
}

export function isVideoFile(filename: string): boolean {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']
  const ext = getFileExtension(filename)
  return videoExtensions.includes(ext)
}

export function shouldGenerateThumbnail(filename: string): boolean {
  return isImageFile(filename) || isVideoFile(filename)
}

// 获取文件的MIME类型
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    // 图片
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    
    // 视频
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    
    // 文档
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    md: 'text/markdown',
    
    // 压缩文件
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    
    // 代码文件
    js: 'application/javascript',
    ts: 'application/typescript',
    jsx: 'text/jsx',
    tsx: 'text/tsx',
    json: 'application/json',
    html: 'text/html',
    css: 'text/css',
    scss: 'text/scss',
    less: 'text/less',
    xml: 'application/xml',
    yaml: 'application/x-yaml',
    yml: 'application/x-yaml',
  }
  
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// 检查是否应该显示缩略图
export function shouldShowThumbnail(filename: string, fileSize: number): boolean {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const ext = filename.split('.').pop()?.toLowerCase()
  
  // 只对小于10MB的图片和视频显示缩略图
  const supportedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm']
  
  return fileSize < maxSize && supportedExtensions.includes(ext || '')
}
