'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function SettingsPage() {
  const [isAddingBucket, setIsAddingBucket] = useState(false)
  
  const { data: buckets, isLoading } = useQuery({
    queryKey: ['buckets'],
    queryFn: async () => {
      const res = await fetch('/api/buckets')
      if (!res.ok) throw new Error('Failed to fetch buckets')
      return res.json()
    }
  })
  
  return (
    <div className="h-full flex flex-col">
      {/* 顶部栏 */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">存储桶设置</h2>
            <p className="text-muted-foreground">
              管理您的腾讯云COS存储桶
            </p>
          </div>
          <Button onClick={() => setIsAddingBucket(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加存储桶
          </Button>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : buckets && buckets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {buckets.map((bucket: any) => (
              <Card key={bucket.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{bucket.name}</CardTitle>
                    {bucket.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        默认
                      </span>
                    )}
                  </div>
                  <CardDescription>{bucket.region}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">文件数量</span>
                      <span>{bucket.fileCount || 0}</span>
                    </div>
                    {bucket.customDomain && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">自定义域名</span>
                        <span className="truncate max-w-[150px]">{bucket.customDomain}</span>
                      </div>
                    )}
                    {bucket.description && (
                      <p className="text-muted-foreground pt-2">{bucket.description}</p>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      编辑
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>暂无存储桶</CardTitle>
              <CardDescription>
                点击右上角的"添加存储桶"按钮来添加您的第一个存储桶
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
      
      {/* 这里将添加添加存储桶的对话框组件 */}
    </div>
  )
} 