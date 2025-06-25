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
