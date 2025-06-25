'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { FileIcon, ImageIcon, VideoIcon, MoreHorizontal, Download, Trash2, Eye, Upload, Loader2, FolderOpen } from 'lucide-react'
import { FileWithUrl } from '@/types'
import { useToast } from '@/hooks/use-toast'

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

function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico']
  const ext = getFileExtension(filename)
  return imageExtensions.includes(ext)
}

function isVideoFile(filename: string): boolean {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']
  const ext = getFileExtension(filename)
  return videoExtensions.includes(ext)
}

interface FileManagerProps {
  bucketId: string
  prefix?: string
}

export function FileManager({ bucketId, prefix = '' }: FileManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // 获取文件列表
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', bucketId, prefix],
    queryFn: async () => {
      const res = await fetch(`/api/files?bucketId=${bucketId}&prefix=${prefix}`)
      if (!res.ok) throw new Error('Failed to fetch files')
      return res.json()
    }
  })
  
  // 删除文件
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '删除失败')
      }
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: '删除成功',
        description: '文件已删除',
      })
      queryClient.invalidateQueries({ queryKey: ['files', bucketId] })
      setDeleteFileId(null)
    },
    onError: (error: Error) => {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive',
      })
    }
  })
  
  // 处理文件上传
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    setUploading(true)
    
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucketId', bucketId)
        formData.append('prefix', prefix)
        
        const res = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        })
        
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || '上传失败')
        }
      }
      
      toast({
        title: '上传成功',
        description: `${files.length} 个文件已上传`,
      })
      
      queryClient.invalidateQueries({ queryKey: ['files', bucketId] })
    } catch (error) {
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '上传过程中出现错误',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      // 重置input
      event.target.value = ''
    }
  }, [bucketId, prefix, queryClient, toast])
  
  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(files.map((file: FileWithUrl) => file.id).filter(Boolean)))
    } else {
      setSelectedFiles(new Set())
    }
  }
  
  // 单选
  const handleSelectFile = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles)
    if (checked) {
      newSelected.add(fileId)
    } else {
      newSelected.delete(fileId)
    }
    setSelectedFiles(newSelected)
  }
  
  // 获取文件图标
  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) return <ImageIcon className="h-4 w-4" />
    if (isVideoFile(filename)) return <VideoIcon className="h-4 w-4" />
    return <FileIcon className="h-4 w-4" />
  }
  
  // 批量删除
  const handleBulkDelete = () => {
    if (selectedFiles.size === 0) return
    
    const selectedFilesList = Array.from(selectedFiles)
    const firstFile = files.find((f: FileWithUrl) => f.id === selectedFilesList[0])
    
    if (confirm(`您确定要删除 ${selectedFiles.size === 1 
      ? `文件 "${firstFile?.name || '未知文件'}"` 
      : `选中的 ${selectedFiles.size} 个文件`
    } 吗？`)) {
      // 这里可以实现批量删除API
      // 目前先逐个删除
      selectedFilesList.forEach(fileId => {
        deleteMutation.mutate(fileId)
      })
      setSelectedFiles(new Set())
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            上传文件
          </Button>
          
          {selectedFiles.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除选中 ({selectedFiles.size})
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          共 {files.length} 个文件
        </div>
      </div>
      
      {/* 文件列表 */}
      {files.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">该目录下暂无文件</p>
          <p className="text-sm text-muted-foreground mt-2">
            点击上方"上传文件"按钮开始上传
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedFiles.size === files.filter((f: FileWithUrl) => f.id).length && files.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>文件名</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>修改时间</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file: FileWithUrl) => (
                <TableRow key={file.key}>
                  <TableCell>
                    {file.id && (
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={(checked) => handleSelectFile(file.id!, checked as boolean)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.name)}
                      <span className="font-medium">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>{formatDate(file.uploadedAt || new Date())}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                          <Eye className="h-4 w-4 mr-2" />
                          预览
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(file.url + '?response-content-disposition=attachment', '_blank')}>
                          <Download className="h-4 w-4 mr-2" />
                          下载
                        </DropdownMenuItem>
                        {file.id && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteFileId(file.id!)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteFileId} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该文件，无法恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFileId && deleteMutation.mutate(deleteFileId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 