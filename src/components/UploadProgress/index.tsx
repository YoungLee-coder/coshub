'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadFile {
  id: string
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface UploadProgressProps {
  files: UploadFile[]
  onClose?: () => void
  onRetry?: (fileId: string) => void
}

export function UploadProgress({ files, onClose, onRetry }: UploadProgressProps) {
  const totalFiles = files.length
  const completedFiles = files.filter(f => f.status === 'success' || f.status === 'error').length
  const errorFilesCount = files.filter(f => f.status === 'error').length
  const overallProgress = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'uploading':
        return <Upload className="h-4 w-4 text-primary animate-pulse" />
      default:
        return <Upload className="h-4 w-4 text-muted-foreground" />
    }
  }
  
  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'success':
        return '上传成功'
      case 'error':
        return file.error || '上传失败'
      case 'uploading':
        return `上传中 ${file.progress}%`
      default:
        return '等待上传'
    }
  }
  
  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            文件上传进度 ({completedFiles}/{totalFiles})
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Progress value={overallProgress} className="mt-2" />
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getStatusIcon(file.status)}
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground text-xs">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="flex-1 h-1" />
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {getStatusText(file)}
                </span>
                {file.status === 'error' && onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onRetry(file.id)}
                  >
                    重试
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {errorFilesCount > 0 && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            {errorFilesCount} 个文件上传失败
          </div>
        )}
      </CardContent>
    </Card>
  )
} 