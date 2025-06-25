'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'

// 创建一个 QueryClient 实例，配置更长的缓存时间
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据在缓存中保持新鲜的时间（5分钟）
      staleTime: 5 * 60 * 1000,
      // 缓存数据的最长时间（30分钟）
      gcTime: 30 * 60 * 1000,
      // 窗口重新获得焦点时不重新获取
      refetchOnWindowFocus: false,
      // 重新连接时不重新获取
      refetchOnReconnect: false,
      // 失败后重试次数
      retry: 1,
    },
    mutations: {
      // 突变失败后重试次数
      retry: 1,
    }
  }
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
} 