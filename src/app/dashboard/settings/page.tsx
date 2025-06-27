'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Grid3x3, List, HardDrive, RefreshCw, User, Key, ChevronDown, ChevronUp } from 'lucide-react'
import { BucketDialog } from '@/components/BucketDialog'
import { BucketWithStats } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { usePreferences } from '@/stores/preferences'
import { getCacheSize, clearAllCache } from '@/lib/cache'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [isAddingBucket, setIsAddingBucket] = useState(false)
  const [editingBucket, setEditingBucket] = useState<BucketWithStats | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { viewMode, setViewMode } = usePreferences()
  const [cacheSize, setCacheSize] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  
  // 用户名修改相关状态
  const [newUsername, setNewUsername] = useState('')
  const [isChangingUsername, setIsChangingUsername] = useState(false)
  
  // 密码修改相关状态
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // 添加折叠状态
  const [isAccountExpanded, setIsAccountExpanded] = useState(false)
  
  const { data: buckets = [], isLoading: bucketsLoading } = useQuery({
    queryKey: ['buckets'],
    queryFn: async () => {
      const res = await fetch('/api/buckets?includeStats=true')
      if (!res.ok) throw new Error('Failed to fetch buckets')
      return res.json()
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })
  
  const deleteMutation = useMutation({
    mutationFn: async (bucketId: string) => {
      const res = await fetch(`/api/buckets/${bucketId}`, {
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
        description: '存储桶已删除',
      })
      queryClient.invalidateQueries({ queryKey: ['buckets'] })
    },
    onError: (error: Error) => {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive',
      })
    }
  })
  
  const handleDelete = (bucket: BucketWithStats) => {
    if (confirm(`确定要删除存储桶 "${bucket.name}" 吗？此操作不可恢复。`)) {
      deleteMutation.mutate(bucket.id)
    }
  }
  
  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['buckets'] })
    queryClient.refetchQueries({ queryKey: ['buckets'] })
  }

  // 获取缓存大小
  const fetchCacheSize = useCallback(async () => {
    try {
      const size = await getCacheSize()
      setCacheSize(size)
    } catch (error) {
      console.error('Failed to get cache size:', error)
    }
  }, [])

  useEffect(() => {
    fetchCacheSize()
  }, [fetchCacheSize])

  // 清空缓存
  const handleClearCache = async () => {
    setIsLoading(true)
    try {
      await clearAllCache()
      setCacheSize(0)
      toast({
        title: '缓存已清空',
        description: '所有缓存的图片已被删除'
      })
    } catch {
      toast({
        title: '清空失败',
        description: '清空缓存时出现错误',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 修改用户名
  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      toast({
        title: '用户名不能为空',
        description: '请输入新的用户名',
        variant: 'destructive'
      })
      return
    }
    
    if (newUsername.length < 3) {
      toast({
        title: '用户名太短',
        description: '用户名长度至少为3位',
        variant: 'destructive'
      })
      return
    }
    
    setIsChangingUsername(true)
    try {
      const res = await fetch('/api/user/username', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newUsername: newUsername.trim(),
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || '修改用户名失败')
      }
      
      toast({
        title: '用户名已修改',
        description: '请使用新用户名重新登录',
      })
      
      // 延迟一下让用户看到提示
      setTimeout(async () => {
        await signOut({ redirect: false })
        router.push('/login')
      }, 1500)
      
    } catch (error) {
      toast({
        title: '修改失败',
        description: error instanceof Error ? error.message : '修改用户名失败',
        variant: 'destructive'
      })
    } finally {
      setIsChangingUsername(false)
    }
  }

  // 修改密码
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: '密码不匹配',
        description: '两次输入的密码不一致',
        variant: 'destructive'
      })
      return
    }
    
    if (newPassword.length < 6) {
      toast({
        title: '密码太短',
        description: '密码长度至少为6位',
        variant: 'destructive'
      })
      return
    }
    
    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || '修改密码失败')
      }
      
      toast({
        title: '密码已修改',
        description: '请使用新密码重新登录',
      })
      
      // 延迟一下让用户看到提示
      setTimeout(async () => {
        await signOut({ redirect: false })
        router.push('/login')
      }, 1500)
      
    } catch (error) {
      toast({
        title: '修改失败',
        description: error instanceof Error ? error.message : '修改密码失败',
        variant: 'destructive'
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 添加手动刷新函数
  const refreshBuckets = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['buckets'] })
  }, [queryClient])
  
  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshBuckets()
        fetchCacheSize() // 同时刷新缓存大小
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshBuckets, fetchCacheSize])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">设置</h1>
        <p className="text-muted-foreground">管理存储桶和应用设置</p>
      </div>
      
      <div className="space-y-8">
        {/* 账号管理 */}
        <div>
          <Card>
            <CardHeader 
              className="cursor-pointer select-none"
              onClick={() => setIsAccountExpanded(!isAccountExpanded)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    账号管理
                  </CardTitle>
                  <CardDescription>
                    管理您的账号信息和安全设置
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {isAccountExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {isAccountExpanded && (
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x">
                  {/* 左侧：用户信息和修改用户名 */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        用户信息
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <Label className="text-sm text-muted-foreground">当前用户名</Label>
                          <p className="text-lg font-medium mt-1">{session?.user?.name || 'admin'}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-username">新用户名</Label>
                          <div className="flex gap-2">
                            <Input
                              id="new-username"
                              type="text"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              placeholder="至少3位字符"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newUsername.trim()) {
                                  handleChangeUsername()
                                }
                              }}
                            />
                            <Button 
                              onClick={handleChangeUsername}
                              disabled={isChangingUsername || !newUsername.trim()}
                              className="shrink-0"
                            >
                              {isChangingUsername ? '修改中...' : '修改'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 右侧：修改密码 */}
                  <div className="pt-6 md:pt-0 md:pl-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      安全设置
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">当前密码</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="请输入当前密码"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="new-password">新密码</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="至少6位字符"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirm-password">确认新密码</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="请再次输入新密码"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && currentPassword && newPassword && confirmPassword) {
                              handleChangePassword()
                            }
                          }}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleChangePassword}
                        disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="w-full"
                      >
                        {isChangingPassword ? '修改中...' : '修改密码'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
        
        {/* 存储桶管理 */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold">存储桶管理</h2>
              {/* 视图切换按钮 */}
              <div className="flex items-center rounded-md border">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={() => setIsAddingBucket(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加存储桶
            </Button>
          </div>
          
          {/* 存储桶列表 */}
          <h3 className="text-lg font-semibold mb-4">存储桶列表</h3>
          {bucketsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : !buckets || buckets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">还没有添加任何存储桶</p>
                <Button onClick={() => setIsAddingBucket(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加第一个存储桶
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buckets.map((bucket: BucketWithStats) => (
                <Card key={bucket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{bucket.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {bucket.region}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingBucket(bucket)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(bucket)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">文件数</p>
                        <p className="font-semibold">{bucket.fileCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">存储量</p>
                        <p className="font-semibold">{formatSize(bucket.totalSize || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">名称</th>
                      <th className="text-left p-4">区域</th>

                      <th className="text-left p-4">文件数</th>
                      <th className="text-left p-4">存储量</th>
                      <th className="text-right p-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buckets.map((bucket: BucketWithStats) => (
                      <tr key={bucket.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{bucket.name}</td>
                        <td className="p-4">{bucket.region}</td>

                        <td className="p-4">{bucket.fileCount || 0}</td>
                        <td className="p-4">{formatSize(bucket.totalSize || 0)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingBucket(bucket)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(bucket)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 缓存管理 - 添加更大的间距 */}
        <div className="pt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                缓存管理
              </CardTitle>
              <CardDescription>
                管理浏览器中缓存的图片数据，清空缓存可以释放存储空间
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">缓存大小</p>
                  <p className="text-2xl font-bold">{formatSize(cacheSize)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCacheSize}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearCache}
                    disabled={isLoading || cacheSize === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    清空缓存
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• 缓存可以加快图片加载速度，减少网络流量</p>
                <p>• 缓存的图片会在 24 小时后自动过期</p>
                <p>• 清空缓存不会影响云端的文件</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 存储桶对话框 */}
      <BucketDialog
        open={isAddingBucket || !!editingBucket}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingBucket(false)
            setEditingBucket(null)
          }
        }}
        bucket={editingBucket || undefined}
        onSuccess={handleSuccess}
      />
    </div>
  )
} 