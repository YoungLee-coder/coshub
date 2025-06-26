'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import { FileWithUrl } from '@/types'

// 工具函数
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取文件类型
function getFileType(filename: string): 'image' | 'video' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico']
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']
  
  if (imageExtensions.includes(ext)) return 'image'
  if (videoExtensions.includes(ext)) return 'video'
  return 'other'
}

interface ThumbnailViewerProps {
  file: FileWithUrl | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThumbnailViewer({ file, open, onOpenChange }: ThumbnailViewerProps) {
  if (!file) return null
  
  const isImage = getFileType(file.name) === 'image'
  const isVideo = getFileType(file.name) === 'video'
  const hasPreview = isImage || isVideo
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-2">{file.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 预览区 */}
          {hasPreview && (
            <div className="bg-secondary rounded-lg p-4 flex items-center justify-center min-h-[400px]">
              {isImage ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full max-h-[500px] object-contain rounded"
                  loading="eager"
                />
              ) : isVideo ? (
                <video
                  src={file.url}
                  controls
                  className="max-w-full max-h-[500px] rounded"
                  poster={file.thumbnailUrl || undefined}
                >
                  您的浏览器不支持视频播放
                </video>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>无法预览此文件类型</p>
                  <p className="text-sm mt-2">点击下方按钮下载或在新窗口中打开</p>
                </div>
              )}
            </div>
          )}
          
          {/* 文件信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">文件大小：</span>
              <span className="font-medium">{formatFileSize(file.size)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">文件类型：</span>
              <span className="font-medium">{file.type || '未知'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">上传时间：</span>
              <span className="font-medium">{formatDate(file.uploadedAt || new Date())}</span>
            </div>
            <div>
              <span className="text-muted-foreground">文件路径：</span>
              <span className="font-medium truncate" title={file.key}>{file.key}</span>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(file.url, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              在新窗口打开
            </Button>
            <Button
              onClick={() => window.open(file.url + '?response-content-disposition=attachment', '_blank')}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              下载文件
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 