import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 导出一个独立的中间件函数来处理初始化检查
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // API路由和静态资源不需要检查
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }
  
  // 初始化页面本身不需要检查
  if (pathname === '/initialize') {
    return NextResponse.next()
  }
  
  // 检查初始化状态
  try {
    const initCheckUrl = new URL('/api/auth/initialize', req.url)
    const initResponse = await fetch(initCheckUrl.toString())
    
    if (initResponse.ok) {
      const data = await initResponse.json()
      
      // 如果系统未初始化，重定向到初始化页面
      if (!data.initialized || !data.hasEnvConfig) {
        if (pathname !== '/initialize') {
          return NextResponse.redirect(new URL('/initialize', req.url))
        }
      } else if (data.initialized && pathname === '/') {
        // 如果已初始化且访问根路径，重定向到登录页
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }
  } catch (error) {
    // 如果检查失败，允许继续（让页面处理错误）
    console.error('Failed to check initialization status:', error)
  }
  
  // 对于需要认证的路由，使用 withAuth
  const publicPaths = ['/login', '/initialize', '/api/auth', '/']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  if (!isPublicPath) {
    return (withAuth as any)(req)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
} 