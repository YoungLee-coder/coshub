import { FileWithUrl } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Folder, MoreVertical, Eye, Download, Link2, Trash2 } from 'lucide-react'

interface GridViewProps {
  files: FileWithUrl[]
  folders: { name: string; path: string }[]
  selectedFiles: Set<string>
  onSelectFile: (fileId: string, checked: boolean) => void
  onPreviewFile: (file: FileWithUrl) => void
  onDeleteFile: (fileId: string) => void
  onNavigateToFolder: (path: string) => void
  onCopyLink: (file: FileWithUrl) => void
  getFilePreview: (file: FileWithUrl) => React.ReactNode
  formatFileSize: (size: number) => string
  formatDate: (date: Date | string) => string
}

export function GridView({
  files,
  folders,
  selectedFiles,
  onSelectFile,
  onPreviewFile,
  onDeleteFile,
  onNavigateToFolder,
  onCopyLink,
  getFilePreview,
  formatFileSize,
  formatDate,
}: GridViewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {/* 显示文件夹 */}
      {folders.map((folder) => (
        <Card
          key={folder.path}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateToFolder(folder.path)}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <Folder className="h-16 w-16 text-blue-500 mb-2" />
              <p className="font-medium truncate w-full">{folder.name}</p>
              <p className="text-xs text-muted-foreground">文件夹</p>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* 显示文件 */}
      {files.map((file) => (
        <Card key={file.key} className="relative group">
          <CardContent className="p-4">
            {/* 选择框 */}
            {file.id && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedFiles.has(file.id)}
                  onCheckedChange={(checked) => onSelectFile(file.id!, checked as boolean)}
                  className="bg-background"
                />
              </div>
            )}
            
            {/* 更多操作按钮 */}
            <div className="absolute top-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
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
                  <DropdownMenuItem onClick={() => onCopyLink(file)}>
                    <Link2 className="h-4 w-4 mr-2" />
                    复制链接
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
            
            {/* 文件预览 */}
            <div
              className="flex flex-col items-center text-center cursor-pointer"
              onClick={() => onPreviewFile(file)}
            >
              <div className="h-24 w-24 mb-2 flex items-center justify-center">
                {getFilePreview(file)}
              </div>
              <p className="font-medium truncate w-full">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(file.uploadedAt || new Date())}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 