'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

export default function Home() {
  const router = useRouter()
  
  const { data, isLoading } = useQuery({
    queryKey: ['init-status'],
    queryFn: async () => {
      const res = await fetch('/api/auth/initialize')
      if (!res.ok) throw new Error('Failed to check init status')
      return res.json()
    },
  })
  
  useEffect(() => {
    if (!isLoading && data) {
      if (!data.initialized) {
        // 未初始化，跳转到初始化页面
        router.push('/initialize')
      } else if (data.isInitialized) {
        // 已初始化，跳转到dashboard
        router.push('/dashboard')
      }
    }
  }, [data, isLoading, router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">CosHub</h1>
        <p className="text-muted-foreground">正在加载...</p>
      </div>
    </div>
  )
}
