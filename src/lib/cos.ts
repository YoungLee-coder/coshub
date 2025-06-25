import COS from 'cos-nodejs-sdk-v5'
import { CosConfig, CosFile } from '@/types'
import { decrypt } from './utils'

// 创建COS实例
export function createCosInstance(config: CosConfig): COS {
  return new COS({
    SecretId: config.secretId,
    SecretKey: decrypt(config.secretKey), // 解密密钥
    Protocol: 'https:',
  })
}

// 获取文件列表
export async function listFiles(
  cos: COS,
  bucket: string,
  region: string,
  prefix?: string,
  maxKeys?: number
): Promise<CosFile[]> {
  return new Promise((resolve, reject) => {
    cos.getBucket({
      Bucket: bucket,
      Region: region,
      Prefix: prefix || '',
      MaxKeys: maxKeys || 1000,
    }, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      
      const files: CosFile[] = data.Contents.map(item => ({
        key: item.Key,
        name: item.Key.split('/').pop() || item.Key,
        size: parseInt(item.Size),
        lastModified: new Date(item.LastModified),
        eTag: item.ETag,
        storageClass: item.StorageClass,
      }))
      
      resolve(files)
    })
  })
}

// 上传文件
export async function uploadFile(
  cos: COS,
  bucket: string,
  region: string,
  key: string,
  file: Buffer | Blob | string,
  onProgress?: (progress: { loaded: number; total: number; percent: number }) => void
): Promise<{ key: string; location: string; etag: string }> {
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: bucket,
      Region: region,
      Key: key,
      Body: file as any,
      onProgress: (progressData) => {
        if (onProgress) {
          onProgress({
            loaded: progressData.loaded,
            total: progressData.total,
            percent: Math.floor(progressData.percent * 100),
          })
        }
      },
    }, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      
      resolve({
        key,
        location: data.Location,
        etag: data.ETag,
      })
    })
  })
}

// 删除文件
export async function deleteFile(
  cos: COS,
  bucket: string,
  region: string,
  key: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    cos.deleteObject({
      Bucket: bucket,
      Region: region,
      Key: key,
    }, (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

// 批量删除文件
export async function deleteMultipleFiles(
  cos: COS,
  bucket: string,
  region: string,
  keys: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    cos.deleteMultipleObject({
      Bucket: bucket,
      Region: region,
      Objects: keys.map(key => ({ Key: key })),
    }, (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

// 获取文件URL
export function getFileUrl(
  bucket: string,
  region: string,
  key: string,
  customDomain?: string
): string {
  if (customDomain) {
    // 使用自定义域名
    return `${customDomain}/${key}`
  }
  // 使用默认域名
  return `https://${bucket}.cos.${region}.myqcloud.com/${key}`
}

// 生成临时访问URL
export async function getSignedUrl(
  cos: COS,
  bucket: string,
  region: string,
  key: string,
  expires: number = 900 // 默认15分钟
): Promise<string> {
  return new Promise((resolve, reject) => {
    cos.getObjectUrl({
      Bucket: bucket,
      Region: region,
      Key: key,
      Sign: true,
      Expires: expires,
    }, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data.Url)
    })
  })
}

// 复制文件
export async function copyFile(
  cos: COS,
  sourceBucket: string,
  sourceRegion: string,
  sourceKey: string,
  targetBucket: string,
  targetRegion: string,
  targetKey: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    cos.putObjectCopy({
      Bucket: targetBucket,
      Region: targetRegion,
      Key: targetKey,
      CopySource: `${sourceBucket}.cos.${sourceRegion}.myqcloud.com/${sourceKey}`,
    }, (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

// 检查文件是否存在
export async function checkFileExists(
  cos: COS,
  bucket: string,
  region: string,
  key: string
): Promise<boolean> {
  return new Promise((resolve) => {
    cos.headObject({
      Bucket: bucket,
      Region: region,
      Key: key,
    }, (err) => {
      resolve(!err)
    })
  })
} 