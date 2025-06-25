'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BucketSelector } from '@/components/BucketSelector'
import { FileManager } from '@/components/FileManager'
import { useBucketStore } from '@/stores/bucket'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { selectedBucket } = useBucketStore()
  
  const handleAddBucket = () => {
    router.push('/dashboard/settings')
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* 顶部栏 */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">文件管理</h2>
            <p className="text-muted-foreground">
              欢迎回来，{session?.user?.name || '用户'}
            </p>
          </div>
          <div className="flex gap-2">
            <BucketSelector onAddBucket={handleAddBucket} />
          </div>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 p-6 overflow-auto">
        {!selectedBucket ? (
          <Card>
            <CardHeader>
              <CardTitle>开始使用</CardTitle>
              <CardDescription>
                请先选择一个存储桶或在设置中添加新的存储桶
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  CosHub 是一个腾讯云 COS 可视化管理面板，您可以：
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>管理多个存储桶中的文件</li>
                  <li>上传、下载、删除文件</li>
                  <li>自动生成缩略图，节省流量</li>
                  <li>使用自定义域名访问文件</li>
                </ul>
                <div className="pt-4">
                  <Button asChild>
                    <a href="/dashboard/settings">前往设置</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{selectedBucket.name}</CardTitle>
                <CardDescription>
                  {selectedBucket.description || `地域: ${selectedBucket.region}`}
                  {selectedBucket.customDomain && (
                    <span className="block mt-1">
                      自定义域名: {selectedBucket.customDomain}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
            
            <FileManager bucketId={selectedBucket.id} />
          </div>
        )}
      </div>
    </div>
  )
} 