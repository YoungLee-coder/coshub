'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InitializeFormData } from '@/types'
import { AlertCircle, CheckCircle } from 'lucide-react'

const initializeSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  password: z.string().min(6, '密码至少6个字符'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

export default function InitializePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [needRestart, setNeedRestart] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InitializeFormData>({
    resolver: zodResolver(initializeSchema),
  })
  
  // 检查环境配置状态
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/auth/initialize')
        const data = await res.json()
        
        if (!data.hasEnvConfig) {
          setError('检测到缺少环境配置，将在初始化时自动创建')
        }
      } catch (err) {
        console.error('Failed to check status:', err)
      }
    }
    
    checkStatus()
  }, [])
  
  const onSubmit = async (data: InitializeFormData) => {
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        setError(result.error || '初始化失败')
        return
      }
      
      if (result.needRestart) {
        // 需要重启服务器
        setNeedRestart(true)
        return
      }
      
      // 初始化成功，跳转到登录页
      router.push('/login')
          } catch (err) {
        console.error('Initialize failed:', err)
        setError('初始化失败，请重试')
      } finally {
      setIsLoading(false)
    }
  }
  
  if (needRestart) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              环境配置已创建
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              环境配置文件 <code className="bg-secondary px-1 py-0.5 rounded">.env.local</code> 已自动创建。
            </p>
            <div className="bg-secondary p-4 rounded-md">
              <p className="text-sm font-medium mb-2">请按以下步骤操作：</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>在终端中按 <kbd className="bg-primary/10 px-1 py-0.5 rounded text-xs">Ctrl+C</kbd> 停止服务器</li>
                <li>运行 <code className="bg-primary/10 px-1 py-0.5 rounded text-xs">pnpm dev</code> 重新启动</li>
                <li>刷新此页面继续初始化</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>初始化 CosHub</CardTitle>
          <CardDescription>
            欢迎使用 CosHub！请创建管理员账号以开始使用。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                {...register('username')}
              />
              {errors.username && (
                <p className="text-sm text-destructive mt-1">{errors.username.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '初始化中...' : '开始使用'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 