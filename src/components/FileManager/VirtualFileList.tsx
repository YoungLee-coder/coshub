'use client'

import React, { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Download, Trash2, Eye, Folder, FolderOpen, ChevronRight } from 'lucide-react'
import { FileWithUrl } from '@/types'

interface VirtualFileListProps {
  files: FileWithUrl[]
  folders: Array<{ name: string; path: string }>
  selectedFiles: Set<string>
  onSelectFile: (fileId: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onPreviewFile: (file: FileWithUrl) => void
  onDeleteFile: (fileId: string) => void
  onNavigateToFolder: (path: string) => void
  getFilePreview: (file: FileWithUrl) => React.ReactNode
  formatFileSize: (size: number) => string
  formatDate: (date: Date | string) => string
}

export function VirtualFileList({
  files,
  folders,
  selectedFiles,
  onSelectFile,
  onSelectAll,
  onPreviewFile,
  onDeleteFile,
  onNavigateToFolder,
  getFilePreview,
  formatFileSize,
  formatDate
}: VirtualFileListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  // 合并文件夹和文件列表
  const allItems = [...folders.map(f => ({ type: 'folder' as const, data: f })), ...files.map(f => ({ type: 'file' as const, data: f }))]
  
  // 设置虚拟列表
  const virtualizer = useVirtualizer({
    count: allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // 每行的估计高度
    overscan: 5, // 额外渲染的行数
  })
  
  const items = virtualizer.getVirtualItems()
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 表头 */}
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="flex items-center h-12 px-4 text-sm font-medium text-muted-foreground">
          <div className="w-12 flex items-center">
            <Checkbox
              checked={selectedFiles.size === files.filter(f => f.id).length && files.length > 0}
              onCheckedChange={onSelectAll}
            />
          </div>
          <div className="w-16">预览</div>
          <div className="flex-1">文件名</div>
          <div className="w-32">大小</div>
          <div className="w-40">修改时间</div>
          <div className="w-12"></div>
        </div>
      </div>
      
      {/* 虚拟列表容器 */}
      <div
        ref={parentRef}
        className="max-h-[600px] overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualItem) => {
            const item = allItems[virtualItem.index]
            
            if (item.type === 'folder') {
              const folder = item.data
              return (
                <div
                  key={virtualItem.key}
                  className="flex items-center h-[60px] px-4 border-b cursor-pointer hover:bg-muted/50"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  onClick={() => onNavigateToFolder(folder.path)}
                >
                  <div className="w-12">
                    {/* 文件夹不支持选择 */}
                  </div>
                  <div className="w-16">
                    <Folder className="h-10 w-10 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium flex items-center gap-2">
                      {folder.name}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </div>
                  <div className="w-32"></div>
                  <div className="w-40"></div>
                  <div className="w-12">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onNavigateToFolder(folder.path)}>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          打开
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            }
            
            const file = item.data as FileWithUrl
            return (
              <div
                key={virtualItem.key}
                className="flex items-center h-[60px] px-4 border-b hover:bg-muted/50"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="w-12">
                  {file.id && (
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={(checked) => onSelectFile(file.id!, checked as boolean)}
                    />
                  )}
                </div>
                <div className="w-16">
                  <button
                    onClick={() => onPreviewFile(file)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    {getFilePreview(file)}
                  </button>
                </div>
                <div className="flex-1">
                  <span className="font-medium truncate">{file.name}</span>
                </div>
                <div className="w-32 text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </div>
                <div className="w-40 text-sm text-muted-foreground">
                  {formatDate(file.uploadedAt || new Date())}
                </div>
                <div className="w-12">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPreviewFile(file)}>
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
                          onClick={() => onDeleteFile(file.id!)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 