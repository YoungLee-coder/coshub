import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 导出中间件函数
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // API路由和静态资源不需要检查
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }
  
  // 根路径重定向到登录页
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  // 对于需要认证的路由，使用 withAuth
  const publicPaths = ['/login', '/api/auth']
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