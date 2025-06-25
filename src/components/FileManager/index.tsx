'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { FileIcon, ImageIcon, VideoIcon, MoreHorizontal, Download, Trash2, Eye, Upload, Loader2, FolderOpen, Search, X, SlidersHorizontal, Folder, FolderPlus, ChevronRight, Home, Archive } from 'lucide-react'
import { FileWithUrl } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { ThumbnailViewer } from '@/components/ThumbnailViewer'
import { UploadProgress } from '@/components/UploadProgress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { VirtualFileList } from './VirtualFileList'
import { FileSkeleton } from './FileSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

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

function isDocumentFile(filename: string): boolean {
  const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md']
  const ext = getFileExtension(filename)
  return docExtensions.includes(ext)
}

interface FileManagerProps {
  bucketId: string
  prefix?: string
}

interface UploadingFile {
  id: string
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// 添加搜索过滤器类型
interface SearchFilters {
  query: string
  type: 'all' | 'image' | 'video' | 'document' | 'other'
  sizeRange: 'all' | 'small' | 'medium' | 'large'
  dateRange: 'all' | 'today' | 'week' | 'month'
}

// 文件夹类型
interface FolderItem {
  name: string
  path: string
}

export function FileManager({ bucketId, prefix = '' }: FileManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileWithUrl | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [showUploadProgress, setShowUploadProgress] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    sizeRange: 'all',
    dateRange: 'all'
  })
  const [currentPath, setCurrentPath] = useState(prefix)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // 获取文件列表
  const { data: allData = { files: [], folders: [] }, isLoading } = useQuery({
    queryKey: ['files', bucketId, currentPath],
    queryFn: async () => {
      const res = await fetch(`/api/files?bucketId=${bucketId}&prefix=${currentPath}`)
      if (!res.ok) throw new Error('Failed to fetch files')
      const data = await res.json()
      
      // 处理文件和文件夹
      const files: FileWithUrl[] = []
      const folders: FolderItem[] = []
      const processedPaths = new Set<string>()
      
      // API 返回格式是 { files: [], nextMarker: null, isTruncated: false }
      const responseData = data.files || []
      responseData.forEach((item: FileWithUrl) => {
        const relativePath = currentPath ? item.key.slice(currentPath.length) : item.key
        const parts = relativePath.split('/').filter(Boolean)
        
        if (parts.length === 1) {
          // 这是当前目录下的文件
          files.push(item)
        } else if (parts.length > 1) {
          // 这是子文件夹或子文件夹中的文件
                      const folderName = parts[0]
            const subFolderPath = currentPath ? `${currentPath}${folderName}/` : `${folderName}/`
            
            if (!processedPaths.has(subFolderPath)) {
              processedPaths.add(subFolderPath)
              folders.push({
                name: folderName,
                path: subFolderPath
              })
            }
        }
      })
      
      return { files, folders }
    },
    // 缓存优化
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    gcTime: 10 * 60 * 1000, // 10分钟后垃圾回收
    refetchOnWindowFocus: false, // 窗口获得焦点时不重新获取
  })
  
  const { files: allFiles, folders: allFolders } = allData
  
  // 调试日志
  console.log('FileManager - allData:', allData)
  console.log('FileManager - allFiles:', allFiles)
  console.log('FileManager - allFolders:', allFolders)
  
  // 过滤文件和文件夹（文件夹不需要过滤）
  
  // 过滤文件列表
  const files = useMemo(() => {
    let filtered = allFiles
    
    // 按搜索词过滤
    if (searchFilters.query.trim()) {
      const query = searchFilters.query.toLowerCase()
      filtered = filtered.filter((file: FileWithUrl) => {
        const fileName = file.name.toLowerCase()
        return fileName.includes(query)
      })
    }
    
    // 按文件类型过滤
    if (searchFilters.type !== 'all') {
      filtered = filtered.filter((file: FileWithUrl) => {
        switch (searchFilters.type) {
          case 'image':
            return isImageFile(file.name)
          case 'video':
            return isVideoFile(file.name)
          case 'document':
            return isDocumentFile(file.name)
          case 'other':
            return !isImageFile(file.name) && !isVideoFile(file.name) && !isDocumentFile(file.name)
          default:
            return true
        }
      })
    }
    
    // 按文件大小过滤
    if (searchFilters.sizeRange !== 'all') {
      filtered = filtered.filter((file: FileWithUrl) => {
        const size = file.size
        switch (searchFilters.sizeRange) {
          case 'small':
            return size < 1024 * 1024 // < 1MB
          case 'medium':
            return size >= 1024 * 1024 && size < 10 * 1024 * 1024 // 1MB - 10MB
          case 'large':
            return size >= 10 * 1024 * 1024 // > 10MB
          default:
            return true
        }
      })
    }
    
    // 按上传时间过滤
    if (searchFilters.dateRange !== 'all') {
      const now = new Date()
      filtered = filtered.filter((file: FileWithUrl) => {
        const uploadDate = new Date(file.uploadedAt || new Date())
        const diffTime = now.getTime() - uploadDate.getTime()
        const diffDays = diffTime / (1000 * 60 * 60 * 24)
        
        switch (searchFilters.dateRange) {
          case 'today':
            return diffDays < 1
          case 'week':
            return diffDays < 7
          case 'month':
            return diffDays < 30
          default:
            return true
        }
      })
    }
    
    return filtered
  }, [allFiles, searchFilters])
  
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
    setShowUploadProgress(true)
    
    // 初始化上传文件状态
    const newUploadingFiles: UploadingFile[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending' as const
    }))
    
    setUploadingFiles(newUploadingFiles)
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const uploadingFile = newUploadingFiles[i]
        
        // 更新状态为上传中
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id 
            ? { ...f, status: 'uploading' as const, progress: 0 } 
            : f
          )
        )
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucketId', bucketId)
        formData.append('prefix', currentPath)
        
        try {
          // 使用 XMLHttpRequest 以支持上传进度
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded * 100) / e.total)
                setUploadingFiles(prev => 
                  prev.map(f => f.id === uploadingFile.id 
                    ? { ...f, progress } 
                    : f
                  )
                )
              }
            })
            
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploadingFiles(prev => 
                  prev.map(f => f.id === uploadingFile.id 
                    ? { ...f, status: 'success' as const, progress: 100 } 
                    : f
                  )
                )
                resolve(xhr.response)
              } else {
                const error = `上传失败: ${xhr.statusText}`
                setUploadingFiles(prev => 
                  prev.map(f => f.id === uploadingFile.id 
                    ? { ...f, status: 'error' as const, error } 
                    : f
                  )
                )
                reject(new Error(error))
              }
            })
            
            xhr.addEventListener('error', () => {
              const error = '网络错误'
              setUploadingFiles(prev => 
                prev.map(f => f.id === uploadingFile.id 
                  ? { ...f, status: 'error' as const, error } 
                  : f
                )
              )
              reject(new Error(error))
            })
            
            xhr.open('POST', '/api/files')
            xhr.send(formData)
          })
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
        }
      }
      
      // 检查上传结果
      const successCount = uploadingFiles.filter(f => f.status === 'success').length
      const errorCount = uploadingFiles.filter(f => f.status === 'error').length
      
      if (successCount > 0) {
        toast({
          title: '上传完成',
          description: `${successCount} 个文件上传成功${errorCount > 0 ? `，${errorCount} 个失败` : ''}`,
        })
        
        queryClient.invalidateQueries({ queryKey: ['files', bucketId] })
      }
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
      
      // 3秒后自动关闭进度框（如果没有错误）
      setTimeout(() => {
        if (uploadingFiles.every(f => f.status !== 'error')) {
          setShowUploadProgress(false)
          setUploadingFiles([])
        }
      }, 3000)
    }
  }, [bucketId, currentPath, queryClient, toast, uploadingFiles])
  
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
  
  // 获取文件图标或缩略图
  const getFilePreview = (file: FileWithUrl) => {
    // 如果有缩略图，显示缩略图
    if (file.thumbnailUrl && (isImageFile(file.name) || isVideoFile(file.name))) {
      return (
        <div className="relative w-10 h-10 rounded overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // 如果缩略图加载失败，显示默认图标
              const parent = e.currentTarget.parentElement
              if (parent) {
                parent.innerHTML = ''
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                parent.appendChild(getFileIcon(file.name) as any)
              }
            }}
          />
        </div>
      )
    }
    
    // 否则显示图标
    return getFileIcon(file.name)
  }
  
  // 批量删除优化
  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return
    
    const selectedFilesList = Array.from(selectedFiles)
    const selectedFilesData = files.filter((f: FileWithUrl) => 
      f.id && selectedFiles.has(f.id)
    )
    
    const confirmMessage = selectedFiles.size === 1 
      ? `确定要删除文件 「${selectedFilesData[0]?.name || '未知文件'}」 吗？`
      : `确定要删除选中的 ${selectedFiles.size} 个文件吗？`
    
    if (!confirm(confirmMessage)) return
    
    try {
      // 使用批量删除API
      const res = await fetch('/api/files/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: selectedFilesList })
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || '批量删除失败')
      }
      
      toast({
        title: result.success ? '删除成功' : '部分删除成功',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      })
      
      queryClient.invalidateQueries({ queryKey: ['files', bucketId] })
      setSelectedFiles(new Set())
    } catch (error) {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '批量删除过程中出现错误',
        variant: 'destructive',
      })
    }
  }
  
  // 批量下载文件
  const handleBulkDownload = async () => {
    if (selectedFiles.size === 0) return
    
    const selectedFilesData = files.filter((f: FileWithUrl) => 
      f.id && selectedFiles.has(f.id)
    )
    
    // 如果只有一个文件，直接下载
    if (selectedFilesData.length === 1) {
      const file = selectedFilesData[0]
      window.open(file.url + '?response-content-disposition=attachment', '_blank')
      return
    }
    
    // 多个文件，逐个下载
    toast({
      title: '开始下载',
      description: `正在下载 ${selectedFilesData.length} 个文件...`,
    })
    
    for (const file of selectedFilesData) {
      // 创建一个隐藏的a标签来触发下载
      const link = document.createElement('a')
      link.href = file.url + '?response-content-disposition=attachment'
      link.download = file.name
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 延迟一下，避免浏览器阻止多个下载
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    toast({
      title: '下载完成',
      description: `已触发 ${selectedFilesData.length} 个文件的下载`,
    })
    
    setSelectedFiles(new Set())
  }
  
  // 批量压缩下载
  const handleBulkCompress = async () => {
    if (selectedFiles.size === 0) return
    
    const selectedFilesData = files.filter((f: FileWithUrl) => 
      f.id && selectedFiles.has(f.id)
    )
    
    try {
      toast({
        title: '正在压缩文件',
        description: `正在压缩 ${selectedFilesData.length} 个文件，请稍候...`,
      })
      
      // 获取文件的key列表
      const fileKeys = selectedFilesData.map(file => file.key)
      
      // 调用压缩API
      const response = await fetch('/api/files/compress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketId,
          fileKeys
        })
      })
      
      if (!response.ok) {
        throw new Error('压缩文件失败')
      }
      
      // 下载ZIP文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `compressed-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: '压缩完成',
        description: `已下载包含 ${selectedFilesData.length} 个文件的压缩包`,
      })
      
      setSelectedFiles(new Set())
    } catch (error) {
      toast({
        title: '压缩失败',
        description: error instanceof Error ? error.message : '压缩文件时出现错误',
        variant: 'destructive',
      })
    }
  }
  
  // 处理文件拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 检查是否真正离开了拖拽区域
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false)
    }
  }, [])
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    
    // 创建一个虚拟的 input change 事件来复用上传逻辑
    const virtualEvent = {
      target: {
        files: e.dataTransfer.files,
        value: ''
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    await handleFileUpload(virtualEvent)
  }, [handleFileUpload])
  
  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: '错误',
        description: '文件夹名称不能为空',
        variant: 'destructive',
      })
      return
    }
    
    // 检查文件夹名称是否合法
    if (newFolderName.includes('/') || newFolderName.includes('\\')) {
      toast({
        title: '错误',
        description: '文件夹名称不能包含 / 或 \\ 字符',
        variant: 'destructive',
      })
      return
    }
    
    try {
      // 在COS中，文件夹是通过创建一个以/结尾的空对象来实现的
      const folderKey = currentPath ? `${currentPath}${newFolderName}/` : `${newFolderName}/`
      
      const formData = new FormData()
      formData.append('file', new Blob([''], { type: 'application/x-directory' }))
      formData.append('bucketId', bucketId)
      formData.append('key', folderKey)
      
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        throw new Error('创建文件夹失败')
      }
      
      toast({
        title: '创建成功',
        description: `文件夹 「${newFolderName}」 已创建`,
      })
      
      queryClient.invalidateQueries({ queryKey: ['files', bucketId, currentPath] })
      setShowCreateFolder(false)
      setNewFolderName('')
    } catch (error) {
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '创建文件夹时出现错误',
        variant: 'destructive',
      })
    }
  }
  
  // 导航到文件夹
  const navigateToFolder = (path: string) => {
    setCurrentPath(path)
    setSelectedFiles(new Set())
  }
  
  // 获取面包屑路径
  const getBreadcrumbs = () => {
    if (!currentPath) return []
    
    const parts = currentPath.split('/').filter(Boolean)
    const breadcrumbs = []
    let path = ''
    
    for (const part of parts) {
      path += `${part}/`
      breadcrumbs.push({
        name: part,
        path: path
      })
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = getBreadcrumbs()
  
  // 判断是否使用虚拟列表
  const useVirtualList = allFiles.length + allFolders.length > 50
  
  // 预取子文件夹数据
  const prefetchFolder = useCallback(async (folderPath: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['files', bucketId, folderPath],
      queryFn: async () => {
        const res = await fetch(`/api/files?bucketId=${bucketId}&prefix=${folderPath}`)
        if (!res.ok) throw new Error('Failed to fetch files')
        const data = await res.json()
        
        // 处理文件和文件夹（同上）
        const files: FileWithUrl[] = []
        const folders: FolderItem[] = []
        const processedPaths = new Set<string>()
        
        // API 返回格式是 { files: [], nextMarker: null, isTruncated: false }
        const responseData = data.files || []
        responseData.forEach((item: FileWithUrl) => {
          const relativePath = folderPath ? item.key.slice(folderPath.length) : item.key
          const parts = relativePath.split('/').filter(Boolean)
          
          if (parts.length === 1) {
            files.push(item)
          } else if (parts.length > 1) {
            const folderName = parts[0]
            const subFolderPath = folderPath ? `${folderPath}${folderName}/` : `${folderName}/`
            
            if (!processedPaths.has(subFolderPath)) {
              processedPaths.add(subFolderPath)
              folders.push({
                name: folderName,
                path: subFolderPath
              })
            }
          }
        })
        
        return { files, folders }
      },
      staleTime: 5 * 60 * 1000,
    })
  }, [bucketId, queryClient])
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* 面包屑导航骨架 */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-20" />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-4 w-24" />
        </div>
        
        {/* 工具栏骨架 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        
        {/* 文件列表骨架 */}
        <FileSkeleton rows={8} />
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <button
          onClick={() => navigateToFolder('')}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>根目录</span>
        </button>
        {breadcrumbs.map((crumb) => (
          <div key={crumb.path} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4" />
            <button
              onClick={() => navigateToFolder(crumb.path)}
              className="hover:text-foreground transition-colors"
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>
      
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
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
          
          <Button
            variant="outline"
            onClick={() => setShowCreateFolder(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            新建文件夹
          </Button>
          
          {selectedFiles.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                下载选中 ({selectedFiles.size})
              </Button>
              {selectedFiles.size > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkCompress}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  压缩下载
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除选中 ({selectedFiles.size})
              </Button>
            </>
          )}
          
          {/* 搜索框 */}
          <div className="relative flex items-center gap-2 flex-1 max-w-md ml-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索文件名..."
                value={searchFilters.query}
                onChange={(e) => setSearchFilters({ ...searchFilters, query: e.target.value })}
                className="pl-9 pr-9"
              />
              {searchFilters.query && (
                <button
                  onClick={() => setSearchFilters({ ...searchFilters, query: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* 高级搜索选项 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">文件类型</label>
                    <Select 
                      value={searchFilters.type} 
                      onValueChange={(value) => setSearchFilters({ ...searchFilters, type: value as SearchFilters['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部类型</SelectItem>
                        <SelectItem value="image">图片</SelectItem>
                        <SelectItem value="video">视频</SelectItem>
                        <SelectItem value="document">文档</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">文件大小</label>
                    <Select 
                      value={searchFilters.sizeRange} 
                      onValueChange={(value) => setSearchFilters({ ...searchFilters, sizeRange: value as SearchFilters['sizeRange'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部大小</SelectItem>
                        <SelectItem value="small">小于 1MB</SelectItem>
                        <SelectItem value="medium">1MB - 10MB</SelectItem>
                        <SelectItem value="large">大于 10MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">上传时间</label>
                    <Select 
                      value={searchFilters.dateRange} 
                      onValueChange={(value) => setSearchFilters({ ...searchFilters, dateRange: value as SearchFilters['dateRange'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部时间</SelectItem>
                        <SelectItem value="today">今天</SelectItem>
                        <SelectItem value="week">最近一周</SelectItem>
                        <SelectItem value="month">最近一月</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSearchFilters({
                      query: '',
                      type: 'all',
                      sizeRange: 'all',
                      dateRange: 'all'
                    })}
                  >
                    重置筛选
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {searchFilters.query && files.length !== allFiles.length ? (
            <>找到 {files.length} 个文件 / 共 {allFiles.length} 个</>
          ) : (
            <>共 {files.length} 个文件</>
          )}
        </div>
      </div>
      
      {/* 文件列表 */}
      {files.length === 0 && allFolders.length === 0 ? (
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">该目录下暂无文件或文件夹</p>
          <p className="text-sm text-muted-foreground mt-2">
            点击上方「上传文件」按钮或拖拽文件到此处开始上传
          </p>
        </div>
      ) : useVirtualList ? (
        // 使用虚拟列表
        <VirtualFileList
          files={files}
          folders={allFolders}
          selectedFiles={selectedFiles}
          onSelectFile={handleSelectFile}
          onSelectAll={handleSelectAll}
          onPreviewFile={setPreviewFile}
          onDeleteFile={setDeleteFileId}
          onNavigateToFolder={navigateToFolder}
          getFilePreview={getFilePreview}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
        />
      ) : (
        <div 
          className={cn(
            "border rounded-lg relative",
            isDragging && "border-primary"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto text-primary mb-2" />
                <p className="text-lg font-medium">释放以上传文件</p>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedFiles.size === files.filter((f: FileWithUrl) => f.id).length && files.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">预览</TableHead>
                <TableHead>文件名</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>修改时间</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 显示文件夹 */}
              {allFolders.map((folder) => (
                <TableRow key={folder.path} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    {/* 文件夹不支持选择 */}
                  </TableCell>
                  <TableCell>
                    <Folder className="h-10 w-10 text-blue-500" />
                  </TableCell>
                  <TableCell 
                    colSpan={3}
                    onClick={() => navigateToFolder(folder.path)}
                    onMouseEnter={() => prefetchFolder(folder.path)}
                  >
                    <span className="font-medium flex items-center gap-2">
                      {folder.name}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigateToFolder(folder.path)}>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          打开
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* 显示文件 */}
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
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="hover:opacity-80 transition-opacity"
                    >
                      {getFilePreview(file)}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{file.name}</span>
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
                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
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
      
      {/* 文件预览对话框 */}
      <ThumbnailViewer
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
      
      {/* 上传进度 */}
      {showUploadProgress && uploadingFiles.length > 0 && (
        <UploadProgress
          files={uploadingFiles}
          onClose={() => {
            setShowUploadProgress(false)
            setUploadingFiles([])
          }}
        />
      )}
      
      {/* 创建文件夹对话框 */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
            <DialogDescription>
              在当前目录下创建一个新的文件夹
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                文件夹名称
              </Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-3"
                placeholder="输入文件夹名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateFolder(false)
              setNewFolderName('')
            }}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 